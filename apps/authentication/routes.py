from flask import render_template, redirect, request, url_for , flash, session
from flask_login import login_user, login_required, logout_user, current_user
from apps.authentication import blueprint
from apps.authentication.forms import LoginForm
from apps.authentication.models import Users
from apps import login_manager
import psycopg2
from psycopg2.extras import DictCursor

@blueprint.route('/')
def route_default():
    return redirect(url_for('authentication_blueprint.login'))

# Database connection function
def get_db_connection():
    return psycopg2.connect(
        host="datavistapostgresql.postgres.database.azure.com",
        database="DataVista",
        user="DataVistaInterns",
        password="Interns@2024"
    )

@blueprint.route('/login', methods=['GET', 'POST'])
def login():
    login_form = LoginForm(request.form)
    if 'login' in request.form:
        username = request.form['username']
        password = request.form['password']
        
        user = Users.query.filter_by(username=username, password=password).first()
        
        if user :
            login_user(user)
            session['username'] = username  # Store username in session
            if user.roleid == 1:
                return redirect(url_for('home.index_sales'))
            elif user.roleid == 2:
                return redirect(url_for('home.index_financial'))
        else:
            return render_template('accounts/login.html',
                                   msg='Wrong user or password',
                                   form=login_form)

    return render_template('accounts/login.html', form=login_form)

# Remove GitHub-related routes and keep other necessary routes


@blueprint.route('/register', methods=['GET', 'POST'])
def register():
    create_account_form = CreateAccountForm(request.form)
    if 'register' in request.form:

        username = request.form['username']
        email = request.form['email']

        # Check usename exists
        user = Users.query.filter_by(username=username).first()
        if user:
            return render_template('accounts/register.html',
                                   msg='Username already registered',
                                   success=False,
                                   form=create_account_form)

        # Check email exists
        user = Users.query.filter_by(email=email).first()
        if user:
            return render_template('accounts/register.html',
                                   msg='Email already registered',
                                   success=False,
                                   form=create_account_form)

        # else we can create the user
        user = Users(**request.form)
        db.session.add(user)
        db.session.commit()

        # Delete user from session
        logout_user()
        
        return render_template('accounts/register.html',
                               msg='Account created successfully.',
                               success=True,
                               form=create_account_form)

    else:
        return render_template('accounts/register.html', form=create_account_form)


@blueprint.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('authentication_blueprint.login'))


# Errors

@login_manager.unauthorized_handler
def unauthorized_handler():
    return render_template('home/page-403.html'), 403

#### -- added 16-07-24
#@login_manager.unauthorized_handler
#def unauthorized_handler():
#    return redirect(url_for('authentication_blueprint.login'))
####

@blueprint.errorhandler(403)
def access_forbidden(error):
    return render_template('home/page-403.html'), 403


@blueprint.errorhandler(404)
def not_found_error(error):
    return render_template('home/page-404.html'), 404


@blueprint.errorhandler(500)
def internal_error(error):
    return render_template('home/page-500.html'), 500

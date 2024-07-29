# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from apps.home import blueprint
from flask import Blueprint, render_template, redirect, url_for, request , session
from flask_login import login_required , LoginManager , login_user , current_user
from jinja2 import TemplateNotFound

# Initialize the blueprint for the home module
blueprint = Blueprint('home', __name__, url_prefix='/')

# Define the login route
@blueprint.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Get the selected role from the form
        selected_role = request.form.get('role', 'financial_analyst')

        # Get the username and password from form data
        username = request.form.get('username')
        password = request.form.get('password')

        # Find the user by username
        user = User.query.filter_by(username=username).first()

        # Check if the user exists and the password is correct
        if user and user.check_password(password):
            # Log the user in
            login_user(user)

            # Redirect based on the selected role
            if selected_role == 'sales_manager':
                return redirect(url_for('home/index-data-metric-sales'))
            elif selected_role == 'financial_analyst':
                return redirect(url_for('home/index-data-metric-financial'))
            else:
                # Handle unexpected role selection
                return redirect(url_for('accounts/login'))

        # Handle login failure (invalid credentials)
        return render_template('login.html', msg='Wrong user or password')

    # Render the login page on GET request
    return render_template('login.html')
# Route for the financial index page
@blueprint.route('/index-data-metric-financial')
@login_required
def index_financial():
    return render_template('home/index-data-metric-financial.html', segment='index')

# Route for the sales index page
@blueprint.route('/index-data-metric-sales')
@login_required
def index_sales():
    username = session.get('username', 'User')  # Get username from session
    return render_template('home/index-data-metric-sales.html', segment='index' , username=username)

# Helper - Extract current page name from request
def get_segment(request):
    try:
        segment = request.path.split('/')[-1]
        if segment == '':
            segment = 'index-data-metric-financial'
        return segment
    except:
        return None

# Catch-all route for serving other templates
@blueprint.route('/<template>')
@login_required
def route_template(template):
    try:
        if not template.endswith('.html'):
            template += '.html'
        segment = get_segment(request)
        return render_template("home/" + template, segment=segment)
    except TemplateNotFound:
        return render_template('home/page-404.html'), 404
    except:
        return render_template('home/page-500.html'), 500
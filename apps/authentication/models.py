from flask_login import UserMixin
from apps import db, login_manager

class Users(db.Model, UserMixin):
    __tablename__ = 'users'
    userid = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True)
    password = db.Column(db.String(500))
    roleid = db.Column(db.Integer)

    def __init__(self, id, username):
        self.userid = id
        self.username = username

    def get_id(self):
        return str(self.userid)

@login_manager.user_loader
def user_loader(user_id):
    return Users.query.get(int(user_id))
import os

class Config(object):
    basedir = os.path.abspath(os.path.dirname(__file__))
    SECRET_KEY = os.getenv('SECRET_KEY', 'S#perS3crEt_007')
    SQLALCHEMY_DATABASE_URI = 'postgresql://DataVistaInterns:Interns%402024@datavistapostgresql.postgres.database.azure.com/DataVista'
    SQLALCHEMY_TRACK_MODIFICATIONS = False 
    ASSETS_ROOT = os.getenv('ASSETS_ROOT', '/static/assets')    

class ProductionConfig(Config):
    DEBUG = False
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_DURATION = 3600

class DebugConfig(Config):
    DEBUG = True

config_dict = {
    'Production': ProductionConfig,
    'Debug'     : DebugConfig
}
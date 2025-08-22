# Production Configuration for Flask Application
import os
from datetime import timedelta

class ProductionConfig:
    """Production configuration"""
    
    # Basic Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-production-secret-key-here'
    DEBUG = False
    TESTING = False
    
    # Database configuration
    MYSQL_HOST = os.environ.get('DATABASE_HOST', 'mysql')
    MYSQL_PORT = int(os.environ.get('DATABASE_PORT', 3306))
    MYSQL_USER = os.environ.get('DATABASE_USER', 'vms_user')
    MYSQL_PASSWORD = os.environ.get('DATABASE_PASSWORD')
    MYSQL_DB = os.environ.get('DATABASE_NAME', 'visitor_management_prod')
    
    # Construct database URI
    if MYSQL_PASSWORD:
        SQLALCHEMY_DATABASE_URI = f'mysql+mysqlconnector://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}'
    else:
        SQLALCHEMY_DATABASE_URI = f'mysql+mysqlconnector://{MYSQL_USER}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}'
    
    # SQLAlchemy configuration
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 3600,
        'pool_timeout': 20,
        'max_overflow': 20
    }
    
    # JWT configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # CORS configuration
    CORS_ORIGINS = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000,http://visitors.pranathiss.com:3000').split(',')
    
    # Email configuration
    MAIL_SERVER = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_USERNAME = os.environ.get('EMAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('EMAIL_USERNAME')
    
    # File upload configuration
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', '/app/uploads')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}
    
    # Session configuration
    SESSION_TYPE = 'redis'
    SESSION_REDIS = os.environ.get('REDIS_URL', 'redis://redis:6379/0')
    SESSION_PERMANENT = False
    SESSION_USE_SIGNER = True
    SESSION_KEY_PREFIX = 'vms:'
    
    # Security configuration
    SECURITY_PASSWORD_SALT = os.environ.get('SECURITY_PASSWORD_SALT') or 'your-security-salt'
    WTF_CSRF_TIME_LIMIT = None
    WTF_CSRF_ENABLED = True
    
    # Logging configuration
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FILE = '/app/logs/app.log'
    
    # Rate limiting
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL', 'redis://redis:6379/1')
    RATELIMIT_DEFAULT = "1000 per hour"
    
    # Celery configuration (for background tasks)
    CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://redis:6379/0')
    CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://redis:6379/0')
    
    # Monitoring
    SENTRY_DSN = os.environ.get('SENTRY_DSN')
    
    # Application-specific settings
    APP_NAME = 'Visitor Management System'
    APP_VERSION = '3.0.0'
    COMPANY_NAME = os.environ.get('COMPANY_NAME', 'Your Company')
    
    # Security headers
    SECURITY_HEADERS = {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
    
    # Feature flags
    ENABLE_REGISTRATION = os.environ.get('ENABLE_REGISTRATION', 'true').lower() == 'true'
    ENABLE_EMAIL_VERIFICATION = os.environ.get('ENABLE_EMAIL_VERIFICATION', 'true').lower() == 'true'
    ENABLE_SMS_NOTIFICATIONS = os.environ.get('ENABLE_SMS_NOTIFICATIONS', 'false').lower() == 'true'
    ENABLE_PHOTO_CAPTURE = os.environ.get('ENABLE_PHOTO_CAPTURE', 'true').lower() == 'true'
    
    # Business rules
    MAX_VISIT_DURATION_HOURS = int(os.environ.get('MAX_VISIT_DURATION_HOURS', 8))
    ADVANCE_BOOKING_DAYS = int(os.environ.get('ADVANCE_BOOKING_DAYS', 30))
    AUTO_CHECKOUT_ENABLED = os.environ.get('AUTO_CHECKOUT_ENABLED', 'true').lower() == 'true'
    
    # Performance settings
    SQLALCHEMY_POOL_SIZE = 20
    SQLALCHEMY_POOL_TIMEOUT = 20
    SQLALCHEMY_POOL_RECYCLE = 3600
    SQLALCHEMY_MAX_OVERFLOW = 30

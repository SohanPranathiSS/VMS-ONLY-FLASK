"""
Application Factory for Flask VMS
Creates and configures the Flask application instance
"""

from flask import Flask
from flask_cors import CORS
import logging
import os
from config.settings import config
from config.database import initialize_db_pool

def create_app(config_name=None):
    """Application factory pattern"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'default')
    
    # Create Flask instance
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    # Initialize database connection pool
    if not initialize_db_pool():
        logger.error("Failed to initialize database connection pool")
        return None
    
    # Setup CORS
    CORS(app, 
         origins=app.config['CORS_ORIGINS'],
         methods=app.config['CORS_METHODS'],
         allow_headers=app.config['CORS_ALLOW_HEADERS'],
         supports_credentials=app.config['CORS_SUPPORTS_CREDENTIALS'])
    
    # Create upload directory if it doesn't exist
    upload_dir = app.config['UPLOAD_FOLDER']
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
        logger.info(f"Created upload directory: {upload_dir}")
    
    # Register blueprints
    register_blueprints(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    logger.info("✅ Flask VMS application created successfully")
    return app

def register_blueprints(app):
    """Register all route blueprints"""
    from src.routes.auth_routes import auth_bp
    from src.routes.visit_routes import visits_bp
    from src.routes.admin_routes import admin_bp
    from src.routes.visitor_routes import visitors_bp
    from src.routes.report_routes import reports_bp
    from src.routes.misc_routes import misc_bp
    from src.routes.payment_routes import payment_routes
    from src.routes.user_routes import user_routes
    from src.routes.subscription_routes import subscription_routes
    
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(visits_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api')
    app.register_blueprint(visitors_bp, url_prefix='/api')
    app.register_blueprint(reports_bp, url_prefix='/api')
    app.register_blueprint(misc_bp, url_prefix='/api')
    app.register_blueprint(payment_routes, url_prefix='/api')
    app.register_blueprint(user_routes, url_prefix='/api/users')
    app.register_blueprint(subscription_routes, url_prefix='/api/subscription')

def register_error_handlers(app):
    """Register application error handlers"""
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Endpoint not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500
    
    @app.errorhandler(400)
    def bad_request(error):
        return {'error': 'Bad request'}, 400

"""
Routes Package Initialization
"""

from .auth_routes import auth_bp
from .visit_routes import visits_bp
from .admin_routes import admin_bp
from .visitor_routes import visitors_bp
from .report_routes import reports_bp
from .misc_routes import misc_bp

__all__ = [
    'auth_bp',
    'visits_bp', 
    'admin_bp',
    'visitors_bp',
    'reports_bp',
    'misc_bp'
]

"""
Admin Routes
Handles administrative functions
"""

from flask import Blueprint, request, jsonify
from app.models import User, Visit
from app.utils import authenticate_token
import logging

logger = logging.getLogger(__name__)

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/admin/users', methods=['GET'])
@authenticate_token
def get_all_users():
    """Get all users (admin only)"""
    try:
        # Check if user has admin role
        if request.user.get('role') != 'admin':
            return jsonify({'error': 'Access denied. Admin role required.'}), 403
        
        users = User.get_all_users()
        return jsonify({'users': users}), 200
        
    except Exception as e:
        logger.error(f"Get all users error: {str(e)}")
        return jsonify({'error': 'Failed to retrieve users'}), 500

@admin_bp.route('/admin/settings', methods=['GET'])
@authenticate_token
def get_admin_settings():
    """Get admin settings"""
    try:
        if request.user.get('role') != 'admin':
            return jsonify({'error': 'Access denied. Admin role required.'}), 403
        
        # Return default settings for now
        settings = {
            'email_notifications': True,
            'auto_checkout_hours': 8,
            'require_host_approval': False,
            'visitor_photo_required': True,
            'max_visit_duration': 480  # minutes
        }
        
        return jsonify({'settings': settings}), 200
        
    except Exception as e:
        logger.error(f"Get admin settings error: {str(e)}")
        return jsonify({'error': 'Failed to retrieve settings'}), 500

@admin_bp.route('/admin/settings', methods=['PUT'])
@authenticate_token
def update_admin_settings():
    """Update admin settings"""
    try:
        if request.user.get('role') != 'admin':
            return jsonify({'error': 'Access denied. Admin role required.'}), 403
        
        data = request.get_json()
        
        # In a full implementation, you'd save these to a settings table
        # For now, just return success
        
        return jsonify({'message': 'Settings updated successfully'}), 200
        
    except Exception as e:
        logger.error(f"Update admin settings error: {str(e)}")
        return jsonify({'error': 'Failed to update settings'}), 500
        

@admin_bp.route('/admin/audit-logs', methods=['GET'])
@authenticate_token
def get_audit_logs():
    """Get audit logs"""
    try:
        if request.user.get('role') != 'admin':
            return jsonify({'error': 'Access denied. Admin role required.'}), 403
        
        # Return empty audit logs for now
        # In a full implementation, you'd have an audit_logs table
        logs = []
        
        return jsonify({'logs': logs}), 200
        
    except Exception as e:
        logger.error(f"Get audit logs error: {str(e)}")
        return jsonify({'error': 'Failed to retrieve audit logs'}), 500

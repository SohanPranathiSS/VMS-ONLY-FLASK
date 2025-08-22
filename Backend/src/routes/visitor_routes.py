"""
Visitor Routes
Handles visitor-specific operations
"""

from flask import Blueprint, request, jsonify
from app.models import Visit
from app.utils import authenticate_token, generate_qr_code
import logging

logger = logging.getLogger(__name__)

visitors_bp = Blueprint('visitors', __name__)

@visitors_bp.route('/visitors/pending', methods=['GET'])
@authenticate_token
def get_pending_visitors():
    """Get pending visitors"""
    try:
        filters = {'status': 'pending'}
        visits = Visit.get_all_visits(filters)
        
        return jsonify({
            'pending_visitors': visits,
            'total': len(visits)
        }), 200
        
    except Exception as e:
        logger.error(f"Get pending visitors error: {str(e)}")
        return jsonify({'error': 'Failed to retrieve pending visitors'}), 500

@visitors_bp.route('/visitors/blacklisted', methods=['GET'])
@authenticate_token
def get_blacklisted_visitors():
    """Get blacklisted visitors"""
    try:
        # Return empty list for now
        # In a full implementation, you'd have a blacklist table
        blacklisted = []
        
        return jsonify({
            'blacklisted_visitors': blacklisted,
            'total': len(blacklisted)
        }), 200
        
    except Exception as e:
        logger.error(f"Get blacklisted visitors error: {str(e)}")
        return jsonify({'error': 'Failed to retrieve blacklisted visitors'}), 500

@visitors_bp.route('/visitors/counts', methods=['GET'])
@authenticate_token
def get_visitor_counts():
    """Get visitor counts for dashboard"""
    try:
        counts = Visit.get_visit_counts()
        return jsonify(counts), 200
        
    except Exception as e:
        logger.error(f"Get visitor counts error: {str(e)}")
        return jsonify({'error': 'Failed to retrieve visitor counts'}), 500

@visitors_bp.route('/visitors/status-counts', methods=['GET'])
@authenticate_token
def get_visitor_status_counts():
    """Get visitor status counts"""
    try:
        counts = Visit.get_visit_counts()
        
        # Format for frontend dashboard
        status_counts = {
            'checked_in': counts.get('checked_in', 0),
            'checked_out': counts.get('checked_out', 0),
            'pending': counts.get('pending', 0),
            'total': counts.get('total_visits', 0)
        }
        
        return jsonify(status_counts), 200
        
    except Exception as e:
        logger.error(f"Get visitor status counts error: {str(e)}")
        return jsonify({'error': 'Failed to retrieve status counts'}), 500

@visitors_bp.route('/visitors/pre-register', methods=['POST'])
@authenticate_token
def pre_register_visitor():
    """Pre-register a visitor"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['visitor_name', 'visitor_email', 'visit_date', 'host_email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Generate QR code for pre-registration
        qr_code = generate_qr_code()
        
        # Create visit with pending status
        visit_data = {
            'visitor_name': data['visitor_name'].strip(),
            'visitor_email': data['visitor_email'].lower().strip(),
            'visitor_phone': data.get('visitor_phone', ''),
            'visitor_company': data.get('visitor_company', ''),
            'purpose_of_visit': data.get('purpose_of_visit', 'Pre-registered visit'),
            'host_name': data.get('host_name', ''),
            'host_email': data['host_email'].lower().strip(),
            'host_department': data.get('host_department', ''),
            'visit_date': data['visit_date'],
            'qr_code': qr_code,
            'status': 'pre-registered'
        }
        
        visit_id = Visit.create_visit(visit_data)
        
        return jsonify({
            'message': 'Visitor pre-registered successfully',
            'visit_id': visit_id,
            'qr_code': qr_code
        }), 201
        
    except Exception as e:
        logger.error(f"Pre-register visitor error: {str(e)}")
        return jsonify({'error': 'Failed to pre-register visitor'}), 500

@visitors_bp.route('/visitors/qr-checkin', methods=['POST'])
def qr_checkin():
    """Check in visitor using QR code"""
    try:
        data = request.get_json()
        qr_code = data.get('qr_code')
        
        if not qr_code:
            return jsonify({'error': 'QR code is required'}), 400
        
        # Find visit by QR code
        # This would require adding a method to Visit model
        # For now, return a placeholder response
        
        return jsonify({
            'message': 'QR check-in functionality to be implemented',
            'qr_code': qr_code
        }), 200
        
    except Exception as e:
        logger.error(f"QR check-in error: {str(e)}")
        return jsonify({'error': 'QR check-in failed'}), 500

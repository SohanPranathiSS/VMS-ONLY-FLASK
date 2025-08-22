"""
Visit Routes
Handles visit creation, retrieval, check-in/check-out
"""

from flask import Blueprint, request, jsonify
from app.models import Visit
from app.utils import authenticate_token, generate_qr_code, send_email, format_datetime
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

visits_bp = Blueprint('visits', __name__)

@visits_bp.route('/visits', methods=['POST'])
@authenticate_token
def create_visit():
    """Create a new visit"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['visitor_name', 'visitor_email', 'visitor_phone', 
                          'purpose_of_visit', 'host_name', 'host_email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Generate QR code
        qr_code = generate_qr_code()
        
        # Prepare visit data
        visit_data = {
            'visitor_name': data['visitor_name'].strip(),
            'visitor_email': data['visitor_email'].lower().strip(),
            'visitor_phone': data['visitor_phone'].strip(),
            'visitor_company': data.get('visitor_company', '').strip(),
            'purpose_of_visit': data['purpose_of_visit'].strip(),
            'host_name': data['host_name'].strip(),
            'host_email': data['host_email'].lower().strip(),
            'host_department': data.get('host_department', '').strip(),
            'visit_date': data.get('visit_date', datetime.now().date()),
            'check_in_time': data.get('check_in_time', datetime.now().time()),
            'qr_code': qr_code,
            'status': 'checked-in'
        }
        
        # Create visit
        visit_id = Visit.create_visit(visit_data)
        
        # Send notification email to host
        host_email_subject = "New Visitor Check-in Notification"
        host_email_body = f"""
        <h2>New Visitor Check-in</h2>
        <p>A visitor has checked in to see you:</p>
        <ul>
            <li><strong>Visitor:</strong> {visit_data['visitor_name']}</li>
            <li><strong>Company:</strong> {visit_data['visitor_company']}</li>
            <li><strong>Purpose:</strong> {visit_data['purpose_of_visit']}</li>
            <li><strong>Check-in Time:</strong> {visit_data['check_in_time']}</li>
        </ul>
        <p>QR Code: {qr_code}</p>
        """
        
        send_email(visit_data['host_email'], host_email_subject, host_email_body)
        
        # Send confirmation email to visitor
        visitor_email_subject = "Visit Confirmation - Visitor Management System"
        visitor_email_body = f"""
        <h2>Visit Confirmation</h2>
        <p>Your visit has been registered successfully:</p>
        <ul>
            <li><strong>Host:</strong> {visit_data['host_name']}</li>
            <li><strong>Purpose:</strong> {visit_data['purpose_of_visit']}</li>
            <li><strong>Date:</strong> {visit_data['visit_date']}</li>
            <li><strong>Check-in Time:</strong> {visit_data['check_in_time']}</li>
        </ul>
        <p>Your QR Code: {qr_code}</p>
        """
        
        send_email(visit_data['visitor_email'], visitor_email_subject, visitor_email_body)
        
        return jsonify({
            'message': 'Visit created successfully',
            'visit_id': visit_id,
            'qr_code': qr_code
        }), 201
        
    except Exception as e:
        logger.error(f"Create visit error: {str(e)}")
        return jsonify({'error': 'Failed to create visit'}), 500

@visits_bp.route('/visits', methods=['GET'])
@authenticate_token
def get_visits():
    """Get all visits with optional filters"""
    try:
        # Extract query parameters for filtering
        filters = {}
        
        if request.args.get('status'):
            filters['status'] = request.args.get('status')
        if request.args.get('date_from'):
            filters['date_from'] = request.args.get('date_from')
        if request.args.get('date_to'):
            filters['date_to'] = request.args.get('date_to')
        if request.args.get('host_email'):
            filters['host_email'] = request.args.get('host_email')
        
        # Get visits from database
        visits = Visit.get_all_visits(filters)
        
        # Format datetime fields for response
        for visit in visits:
            if visit.get('check_in_time'):
                visit['check_in_time'] = format_datetime(visit['check_in_time'])
            if visit.get('check_out_time'):
                visit['check_out_time'] = format_datetime(visit['check_out_time'])
        
        return jsonify({
            'visits': visits,
            'total': len(visits)
        }), 200
        
    except Exception as e:
        logger.error(f"Get visits error: {str(e)}")
        return jsonify({'error': 'Failed to retrieve visits'}), 500

@visits_bp.route('/host-visits', methods=['GET'])
@authenticate_token
def get_host_visits():
    """Get visits for the authenticated host"""
    try:
        # Get host email from authenticated user
        host_email = request.user.get('email')
        
        if not host_email:
            return jsonify({'error': 'Host email not found'}), 400
        
        # Get visits for this host
        visits = Visit.get_host_visits(host_email)
        
        # Format datetime fields
        for visit in visits:
            if visit.get('check_in_time'):
                visit['check_in_time'] = format_datetime(visit['check_in_time'])
            if visit.get('check_out_time'):
                visit['check_out_time'] = format_datetime(visit['check_out_time'])
        
        return jsonify({
            'visits': visits,
            'total': len(visits)
        }), 200
        
    except Exception as e:
        logger.error(f"Get host visits error: {str(e)}")
        return jsonify({'error': 'Failed to retrieve host visits'}), 500

@visits_bp.route('/visits/<int:visit_id>/checkout', methods=['PUT'])
@authenticate_token
def checkout_visitor(visit_id):
    """Check out a visitor"""
    try:
        # Get the visit
        visit = Visit.get_visit_by_id(visit_id)
        if not visit:
            return jsonify({'error': 'Visit not found'}), 404
        
        # Check if already checked out
        if visit['status'] == 'checked-out':
            return jsonify({'error': 'Visitor already checked out'}), 400
        
        # Update visit status
        checkout_time = datetime.now()
        success = Visit.update_visit_status(visit_id, 'checked-out', checkout_time)
        
        if success:
            # Send checkout notification emails
            checkout_email_subject = "Visitor Check-out Notification"
            checkout_email_body = f"""
            <h2>Visitor Check-out</h2>
            <p>Visitor {visit['visitor_name']} has checked out:</p>
            <ul>
                <li><strong>Check-out Time:</strong> {checkout_time.strftime('%Y-%m-%d %H:%M:%S')}</li>
                <li><strong>Visit Duration:</strong> Calculated based on check-in time</li>
            </ul>
            """
            
            # Notify host
            send_email(visit['host_email'], checkout_email_subject, checkout_email_body)
            
            return jsonify({
                'message': 'Visitor checked out successfully',
                'checkout_time': checkout_time.strftime('%Y-%m-%d %H:%M:%S')
            }), 200
        else:
            return jsonify({'error': 'Failed to checkout visitor'}), 500
        
    except Exception as e:
        logger.error(f"Checkout visitor error: {str(e)}")
        return jsonify({'error': 'Failed to checkout visitor'}), 500

@visits_bp.route('/visits/counts', methods=['GET'])
@authenticate_token
def get_visit_counts():
    """Get visit counts for dashboard"""
    try:
        counts = Visit.get_visit_counts()
        return jsonify(counts), 200
        
    except Exception as e:
        logger.error(f"Get visit counts error: {str(e)}")
        return jsonify({'error': 'Failed to retrieve visit counts'}), 500

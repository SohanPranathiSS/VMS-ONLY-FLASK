"""
Miscellaneous Routes
Handles health checks, contact forms, and other utility endpoints
"""

from flask import Blueprint, request, jsonify
from config.database import test_db_connection
from app.utils import send_email, validate_email
from app.models import User
import logging

logger = logging.getLogger(__name__)

misc_bp = Blueprint('misc', __name__)

@misc_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        db_status = test_db_connection()
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected' if db_status else 'disconnected',
            'message': 'Visitor Management System API is running'
        }), 200
        
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'database': 'error',
            'message': str(e)
        }), 500

@misc_bp.route('/test-db', methods=['GET'])
def test_db():
    """Test database connection"""
    try:
        if test_db_connection():
            return jsonify({
                'message': 'Database connection successful',
                'status': 'connected'
            }), 200
        else:
            return jsonify({
                'message': 'Database connection failed',
                'status': 'disconnected'
            }), 500
            
    except Exception as e:
        logger.error(f"Database test error: {str(e)}")
        return jsonify({
            'message': f'Database test failed: {str(e)}',
            'status': 'error'
        }), 500

@misc_bp.route('/contact', methods=['POST'])
def contact():
    """Handle contact form submissions"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'subject', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        name = data['name'].strip()
        email = data['email'].strip()
        subject = data['subject'].strip()
        message = data['message'].strip()
        
        # Validate email
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Send contact email to admin
        admin_email_subject = f"Contact Form: {subject}"
        admin_email_body = f"""
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> {name} ({email})</p>
        <p><strong>Subject:</strong> {subject}</p>
        <p><strong>Message:</strong></p>
        <div style="border-left: 3px solid #ccc; padding-left: 15px;">
            {message.replace('\n', '<br>')}
        </div>
        """
        
        # Send to admin (you'd configure this email in settings)
        admin_email = "admin@example.com"  # This should come from config
        
        if send_email(admin_email, admin_email_subject, admin_email_body):
            # Send confirmation to user
            user_email_subject = "Thank you for contacting us"
            user_email_body = f"""
            <h2>Thank you for your message!</h2>
            <p>Hello {name},</p>
            <p>We have received your message and will get back to you soon.</p>
            <p><strong>Your message:</strong></p>
            <div style="border-left: 3px solid #ccc; padding-left: 15px;">
                {message.replace('\n', '<br>')}
            </div>
            <p>Best regards,<br>Visitor Management System Team</p>
            """
            
            send_email(email, user_email_subject, user_email_body)
            
            return jsonify({'message': 'Contact form submitted successfully'}), 200
        else:
            return jsonify({'error': 'Failed to send contact form'}), 500
        
    except Exception as e:
        logger.error(f"Contact form error: {str(e)}")
        return jsonify({'error': 'Failed to process contact form'}), 500

@misc_bp.route('/book-demo', methods=['POST'])
def book_demo():
    """Handle demo booking requests"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['company_name', 'contact_name', 'email', 'phone']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        company_name = data['company_name'].strip()
        contact_name = data['contact_name'].strip()
        email = data['email'].strip()
        phone = data['phone'].strip()
        preferred_date = data.get('preferred_date', 'Not specified')
        
        # Validate email
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Send demo request email
        admin_email_subject = f"Demo Request from {company_name}"
        admin_email_body = f"""
        <h2>New Demo Request</h2>
        <ul>
            <li><strong>Company:</strong> {company_name}</li>
            <li><strong>Contact:</strong> {contact_name}</li>
            <li><strong>Email:</strong> {email}</li>
            <li><strong>Phone:</strong> {phone}</li>
            <li><strong>Preferred Date:</strong> {preferred_date}</li>
        </ul>
        """
        
        admin_email = "admin@example.com"  # This should come from config
        
        if send_email(admin_email, admin_email_subject, admin_email_body):
            # Send confirmation to requester
            user_email_subject = "Demo Request Received"
            user_email_body = f"""
            <h2>Thank you for your demo request!</h2>
            <p>Hello {contact_name},</p>
            <p>We have received your demo request for {company_name}.</p>
            <p>Our team will contact you shortly to schedule the demonstration.</p>
            <p>Best regards,<br>Visitor Management System Team</p>
            """
            
            send_email(email, user_email_subject, user_email_body)
            
            return jsonify({'message': 'Demo request submitted successfully'}), 200
        else:
            return jsonify({'error': 'Failed to send demo request'}), 500
        
    except Exception as e:
        logger.error(f"Book demo error: {str(e)}")
        return jsonify({'error': 'Failed to process demo request'}), 500

# Preflight handler for CORS
@misc_bp.before_app_request
def handle_preflight():
    """Handle CORS preflight requests"""
    if request.method == "OPTIONS":
        response = jsonify({'message': 'OK'})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response

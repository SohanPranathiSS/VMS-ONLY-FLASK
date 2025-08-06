"""
Utility Functions
Common utility functions extracted from monolithic app.py
"""

import random
import string
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import jwt
from datetime import timedelta
from functools import wraps
from flask import request, jsonify, current_app
import logging

logger = logging.getLogger(__name__)

def generate_qr_code():
    """Generate unique QR code"""
    timestamp = str(int(datetime.now().timestamp()))
    random_str = ''.join(random.choices(string.ascii_letters + string.digits, k=9))
    return f"VMS-{timestamp}-{random_str}"

def send_email(to_email, subject, html_content):
    """Send email notification using Gmail SMTP"""
    try:
        smtp_server = current_app.config['SMTP_SERVER']
        smtp_port = current_app.config['SMTP_PORT'] 
        email_address = current_app.config['EMAIL_ADDRESS']
        email_password = current_app.config['EMAIL_PASSWORD']
        
        if not email_address or not email_password:
            logger.warning("Email credentials not configured")
            return False
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = email_address
        msg['To'] = to_email
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(email_address, email_password)
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

def generate_jwt_token(user_data):
    """Generate JWT token for user authentication"""
    payload = {
        'user_id': user_data.get('user_id'),
        'email': user_data.get('email'),
        'role': user_data.get('role'),
        'exp': datetime.utcnow() + timedelta(hours=current_app.config['JWT_EXPIRATION_DELTA_HOURS'])
    }
    
    return jwt.encode(
        payload, 
        current_app.config['SECRET_KEY'], 
        algorithm=current_app.config['JWT_ALGORITHM']
    )

def decode_jwt_token(token):
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(
            token, 
            current_app.config['SECRET_KEY'], 
            algorithms=[current_app.config['JWT_ALGORITHM']]
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def authenticate_token(f):
    """Authentication decorator for protected routes"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            payload = decode_jwt_token(token)
            if payload is None:
                return jsonify({'error': 'Token is invalid or expired'}), 401
                
            # Add user info to request context
            request.user = payload
            
        except Exception as e:
            logger.error(f"Token authentication error: {str(e)}")
            return jsonify({'error': 'Token authentication failed'}), 401
        
        return f(*args, **kwargs)
    
    return decorated

def allowed_file(filename):
    """Check if uploaded file has allowed extension"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def generate_verification_token():
    """Generate email verification token"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=32))

def format_datetime(dt):
    """Format datetime for consistent display"""
    if dt is None:
        return None
    return dt.strftime('%Y-%m-%d %H:%M:%S')

def validate_email(email):
    """Basic email validation"""
    import re
    # More strict pattern that doesn't allow consecutive dots or leading/trailing dots
    pattern = r'^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return False
    # Check for consecutive dots
    if '..' in email:
        return False
    # Check for leading/trailing dots in local part
    local_part = email.split('@')[0]
    if local_part.startswith('.') or local_part.endswith('.'):
        return False
    return True

def generate_reset_token():
    """Generate password reset token"""
    return generate_verification_token()

def verify_reset_token(token):
    """Verify password reset token"""
    # This is a simplified implementation
    # In production, you'd validate the token properly with expiration
    if token and len(token) > 10:
        return {'user_id': 1}  # Mock user_id
    return None

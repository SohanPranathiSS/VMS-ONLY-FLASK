"""
Authentication Routes
Handles user registration, login, email verification
"""

from flask import Blueprint, request, jsonify
from src.models.user import User
from src.utils.helpers import generate_jwt_token, send_email, generate_verification_token, validate_email
import logging

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'full_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        full_name = data['full_name'].strip()
        role = data.get('role', 'host')
        
        # Validate email format
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if user already exists
        existing_user = User.get_user_by_email(email)
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 409
        
        # Create user
        user_id = User.create_user(email, password, full_name, role)
        
        # Generate verification token and send email
        verification_token = generate_verification_token()
        
        # Store verification token (you'll need to add this to the database)
        # For now, we'll skip email verification in the restructured version
        
        # Send verification email
        verification_link = f"http://localhost:3000/verify-email?token={verification_token}&user_id={user_id}"
        email_subject = "Verify Your Email - Visitor Management System"
        email_body = f"""
        <h2>Welcome to Visitor Management System!</h2>
        <p>Thank you for registering. Please click the link below to verify your email:</p>
        <a href="{verification_link}">Verify Email</a>
        <p>If you didn't register for this account, please ignore this email.</p>
        """
        
        send_email(email, email_subject, email_body)
        
        return jsonify({
            'message': 'User registered successfully. Please check your email for verification.',
            'user_id': user_id
        }), 201
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        # Get user by email
        user = User.get_user_by_email(email)
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Verify password
        if not User.verify_password(user, password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check if email is verified
        if not user.get('is_verified'):
            return jsonify({'error': 'Please verify your email before logging in'}), 401
        
        # Generate JWT token
        token_data = {
            'user_id': user['user_id'],
            'email': user['email'],
            'role': user['role']
        }
        token = generate_jwt_token(token_data)
        
        # Update last login time
        User.update_user(user['user_id'], {'last_login': 'NOW()'})
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'user_id': user['user_id'],
                'email': user['email'],
                'full_name': user['full_name'],
                'role': user['role']
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

@auth_bp.route('/verify-email', methods=['GET'])
def verify_email():
    """Verify user email"""
    try:
        user_id = request.args.get('user_id')
        token = request.args.get('token')
        
        if not user_id or not token:
            return jsonify({'error': 'Missing verification parameters'}), 400
        
        # In a full implementation, you'd verify the token against stored tokens
        # For now, we'll just verify the user exists and mark as verified
        user = User.get_user_by_id(user_id)
        if not user:
            return jsonify({'error': 'Invalid user'}), 400
        
        if user.get('is_verified'):
            return jsonify({'message': 'Email already verified'}), 200
        
        # Mark user as verified
        if User.verify_user_email(user_id):
            return jsonify({'message': 'Email verified successfully'}), 200
        else:
            return jsonify({'error': 'Email verification failed'}), 500
        
    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        return jsonify({'error': 'Email verification failed'}), 500

@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """Resend verification email"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        user = User.get_user_by_email(email.lower().strip())
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.get('is_verified'):
            return jsonify({'message': 'Email already verified'}), 200
        
        # Generate new verification token and send email
        verification_token = generate_verification_token()
        verification_link = f"http://localhost:3000/verify-email?token={verification_token}&user_id={user['user_id']}"
        
        email_subject = "Verify Your Email - Visitor Management System"
        email_body = f"""
        <h2>Email Verification</h2>
        <p>Please click the link below to verify your email:</p>
        <a href="{verification_link}">Verify Email</a>
        """
        
        if send_email(email, email_subject, email_body):
            return jsonify({'message': 'Verification email sent successfully'}), 200
        else:
            return jsonify({'error': 'Failed to send verification email'}), 500
        
    except Exception as e:
        logger.error(f"Resend verification error: {str(e)}")
        return jsonify({'error': 'Failed to resend verification email'}), 500

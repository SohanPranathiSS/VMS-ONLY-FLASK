"""
Comprehensive tests for Utility Helper Functions
"""

import pytest
from unittest.mock import patch, MagicMock
from flask import Flask
import jwt
from datetime import datetime, timedelta
from app.utils.helpers import (
    generate_qr_code,
    send_email,
    generate_jwt_token,
    decode_jwt_token,
    authenticate_token,
    allowed_file,
    generate_verification_token,
    format_datetime,
    validate_email
)

class TestUtilityHelpers:
    """Test utility helper functions"""
    
    def test_generate_qr_code(self):
        """Test QR code generation"""
        qr_code = generate_qr_code()
        
        assert isinstance(qr_code, str)
        assert qr_code.startswith('VMS-')
        assert len(qr_code.split('-')) == 3  # VMS-timestamp-random
    
    def test_generate_qr_code_uniqueness(self):
        """Test that QR codes are unique"""
        qr1 = generate_qr_code()
        qr2 = generate_qr_code()
        
        assert qr1 != qr2
    
    @patch('app.utils.helpers.smtplib.SMTP')
    def test_send_email_success(self, mock_smtp):
        """Test successful email sending"""
        app = Flask(__name__)
        app.config.update({
            'SMTP_SERVER': 'smtp.gmail.com',
            'SMTP_PORT': 587,
            'EMAIL_ADDRESS': 'test@example.com',
            'EMAIL_PASSWORD': 'password'
        })
        
        with app.app_context():
            mock_server = MagicMock()
            mock_smtp.return_value = mock_server
            
            result = send_email('recipient@example.com', 'Test Subject', '<h1>Test Body</h1>')
            
            assert result is True
            mock_server.starttls.assert_called_once()
            mock_server.login.assert_called_once()
            mock_server.send_message.assert_called_once()
            mock_server.quit.assert_called_once()
    
    def test_send_email_no_credentials(self):
        """Test email sending without credentials"""
        app = Flask(__name__)
        app.config.update({
            'EMAIL_ADDRESS': None,
            'EMAIL_PASSWORD': None
        })
        
        with app.app_context():
            result = send_email('recipient@example.com', 'Test Subject', '<h1>Test Body</h1>')
            
            assert result is False
    
    def test_generate_jwt_token(self):
        """Test JWT token generation"""
        app = Flask(__name__)
        app.config.update({
            'SECRET_KEY': 'test-secret-key',
            'JWT_ALGORITHM': 'HS256',
            'JWT_EXPIRATION_DELTA_HOURS': 24
        })
        
        with app.app_context():
            user_data = {
                'user_id': 1,
                'email': 'test@example.com',
                'role': 'host'
            }
            
            token = generate_jwt_token(user_data)
            
            assert isinstance(token, str)
            assert len(token) > 50  # JWT tokens are typically long
    
    def test_decode_jwt_token_valid(self):
        """Test JWT token decoding with valid token"""
        app = Flask(__name__)
        app.config.update({
            'SECRET_KEY': 'test-secret-key',
            'JWT_ALGORITHM': 'HS256'
        })
        
        with app.app_context():
            # Create a valid token
            payload = {
                'user_id': 1,
                'email': 'test@example.com',
                'exp': datetime.utcnow() + timedelta(hours=1)
            }
            token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
            
            decoded = decode_jwt_token(token)
            
            assert decoded is not None
            assert decoded['user_id'] == 1
            assert decoded['email'] == 'test@example.com'
    
    def test_decode_jwt_token_expired(self):
        """Test JWT token decoding with expired token"""
        app = Flask(__name__)
        app.config.update({
            'SECRET_KEY': 'test-secret-key',
            'JWT_ALGORITHM': 'HS256'
        })
        
        with app.app_context():
            # Create an expired token
            payload = {
                'user_id': 1,
                'email': 'test@example.com',
                'exp': datetime.utcnow() - timedelta(hours=1)  # Expired
            }
            token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
            
            decoded = decode_jwt_token(token)
            
            assert decoded is None
    
    def test_decode_jwt_token_invalid(self):
        """Test JWT token decoding with invalid token"""
        app = Flask(__name__)
        app.config.update({
            'SECRET_KEY': 'test-secret-key',
            'JWT_ALGORITHM': 'HS256'
        })
        
        with app.app_context():
            decoded = decode_jwt_token('invalid-token')
            
            assert decoded is None
    
    def test_allowed_file_valid_extensions(self):
        """Test file extension validation with valid files"""
        app = Flask(__name__)
        app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}
        
        with app.app_context():
            assert allowed_file('test.png') is True
            assert allowed_file('document.pdf') is True
            assert allowed_file('image.jpeg') is True
    
    def test_allowed_file_invalid_extensions(self):
        """Test file extension validation with invalid files"""
        app = Flask(__name__)
        app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}
        
        with app.app_context():
            assert allowed_file('test.exe') is False
            assert allowed_file('script.js') is False
            assert allowed_file('noextension') is False
    
    def test_generate_verification_token(self):
        """Test verification token generation"""
        token = generate_verification_token()
        
        assert isinstance(token, str)
        assert len(token) == 32
        assert token.isalnum()
    
    def test_format_datetime_valid(self):
        """Test datetime formatting with valid datetime"""
        dt = datetime(2025, 8, 5, 14, 30, 0)
        formatted = format_datetime(dt)
        
        assert formatted == '2025-08-05 14:30:00'
    
    def test_format_datetime_none(self):
        """Test datetime formatting with None"""
        formatted = format_datetime(None)
        
        assert formatted is None
    
    def test_validate_email_valid(self):
        """Test email validation with valid emails"""
        valid_emails = [
            'test@example.com',
            'user.name@domain.co.uk',
            'admin+tag@company.org',
            'user123@test-domain.com'
        ]
        
        for email in valid_emails:
            assert validate_email(email) is True
    
    def test_validate_email_invalid(self):
        """Test email validation with invalid emails"""
        invalid_emails = [
            'invalid-email',
            '@domain.com',
            'user@',
            'user@domain',
            'user..name@domain.com',
            'user@domain..com'
        ]
        
        for email in invalid_emails:
            assert validate_email(email) is False

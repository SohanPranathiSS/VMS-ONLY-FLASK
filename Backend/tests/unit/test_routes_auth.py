"""
Comprehensive tests for Authentication Routes
"""

import pytest
from unittest.mock import patch, MagicMock
import json
from app.models.user import User

class TestAuthRoutes:
    """Test authentication blueprint routes"""
    
    @patch('app.routes.auth_routes.User.authenticate')
    def test_login_success(self, mock_authenticate, client):
        """Test successful user login"""
        mock_authenticate.return_value = {
            'user_id': 1,
            'username': 'testuser',
            'email': 'test@example.com',
            'role': 'user'
        }
        
        response = client.post('/auth/login', 
            data=json.dumps({
                'username': 'testuser',
                'password': 'password123'
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Login successful'
        assert 'access_token' in data
        assert data['user']['username'] == 'testuser'
    
    @patch('app.routes.auth_routes.User.authenticate')
    def test_login_invalid_credentials(self, mock_authenticate, client):
        """Test login with invalid credentials"""
        mock_authenticate.return_value = None
        
        response = client.post('/auth/login', 
            data=json.dumps({
                'username': 'testuser',
                'password': 'wrongpassword'
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert data['error'] == 'Invalid credentials'
    
    def test_login_missing_data(self, client):
        """Test login with missing data"""
        response = client.post('/auth/login', 
            data=json.dumps({
                'username': 'testuser'
                # Missing password
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    @patch('app.routes.auth_routes.User.create_user')
    @patch('app.routes.auth_routes.User.get_user_by_username')
    @patch('app.routes.auth_routes.User.get_user_by_email')
    def test_register_success(self, mock_get_by_email, mock_get_by_username, mock_create, client):
        """Test successful user registration"""
        mock_get_by_username.return_value = None
        mock_get_by_email.return_value = None
        mock_create.return_value = 123
        
        response = client.post('/auth/register', 
            data=json.dumps({
                'username': 'newuser',
                'email': 'newuser@example.com',
                'password': 'password123',
                'full_name': 'New User',
                'role': 'user'
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'User registered successfully'
        assert data['user_id'] == 123
    
    @patch('app.routes.auth_routes.User.get_user_by_username')
    def test_register_username_exists(self, mock_get_by_username, client):
        """Test registration with existing username"""
        mock_get_by_username.return_value = {'username': 'existinguser'}
        
        response = client.post('/auth/register', 
            data=json.dumps({
                'username': 'existinguser',
                'email': 'newuser@example.com',
                'password': 'password123',
                'full_name': 'New User'
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Username already exists' in data['error']
    
    @patch('app.routes.auth_routes.User.get_user_by_email')
    @patch('app.routes.auth_routes.User.get_user_by_username')
    def test_register_email_exists(self, mock_get_by_username, mock_get_by_email, client):
        """Test registration with existing email"""
        mock_get_by_username.return_value = None
        mock_get_by_email.return_value = {'email': 'existing@example.com'}
        
        response = client.post('/auth/register', 
            data=json.dumps({
                'username': 'newuser',
                'email': 'existing@example.com',
                'password': 'password123',
                'full_name': 'New User'
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Email already exists' in data['error']
    
    def test_register_missing_required_fields(self, client):
        """Test registration with missing required fields"""
        response = client.post('/auth/register', 
            data=json.dumps({
                'username': 'newuser',
                # Missing email, password, full_name
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_register_invalid_email_format(self, client):
        """Test registration with invalid email format"""
        response = client.post('/auth/register', 
            data=json.dumps({
                'username': 'newuser',
                'email': 'invalid-email',
                'password': 'password123',
                'full_name': 'New User'
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Invalid email format' in data['error']
    
    def test_register_weak_password(self, client):
        """Test registration with weak password"""
        response = client.post('/auth/register', 
            data=json.dumps({
                'username': 'newuser',
                'email': 'newuser@example.com',
                'password': '123',  # Too short
                'full_name': 'New User'
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Password must be at least' in data['error']
    
    @patch('app.routes.auth_routes.jwt_required')
    @patch('app.routes.auth_routes.get_jwt_identity')
    def test_logout_success(self, mock_get_identity, mock_jwt_required, client):
        """Test successful user logout"""
        mock_get_identity.return_value = 'testuser'
        
        response = client.post('/auth/logout',
            headers={'Authorization': 'Bearer fake_token'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Successfully logged out'
    
    def test_logout_no_token(self, client):
        """Test logout without token"""
        response = client.post('/auth/logout')
        
        assert response.status_code == 401
    
    @patch('app.routes.auth_routes.User.get_user_by_email')
    @patch('app.routes.auth_routes.send_email')
    @patch('app.routes.auth_routes.generate_reset_token')
    def test_forgot_password_success(self, mock_generate_token, mock_send_email, 
                                   mock_get_user, client):
        """Test successful forgot password request"""
        mock_get_user.return_value = {
            'user_id': 1,
            'email': 'user@example.com',
            'username': 'testuser'
        }
        mock_generate_token.return_value = 'reset_token_123'
        mock_send_email.return_value = True
        
        response = client.post('/auth/forgot-password', 
            data=json.dumps({
                'email': 'user@example.com'
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'Password reset email sent' in data['message']
    
    @patch('app.routes.auth_routes.User.get_user_by_email')
    def test_forgot_password_user_not_found(self, mock_get_user, client):
        """Test forgot password with non-existent email"""
        mock_get_user.return_value = None
        
        response = client.post('/auth/forgot-password', 
            data=json.dumps({
                'email': 'nonexistent@example.com'
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'User not found' in data['error']
    
    @patch('app.routes.auth_routes.verify_reset_token')
    @patch('app.routes.auth_routes.User.update_password')
    def test_reset_password_success(self, mock_update_password, mock_verify_token, client):
        """Test successful password reset"""
        mock_verify_token.return_value = {'user_id': 1}
        mock_update_password.return_value = True
        
        response = client.post('/auth/reset-password', 
            data=json.dumps({
                'token': 'valid_reset_token',
                'new_password': 'newpassword123'
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'Password reset successful' in data['message']
    
    @patch('app.routes.auth_routes.verify_reset_token')
    def test_reset_password_invalid_token(self, mock_verify_token, client):
        """Test password reset with invalid token"""
        mock_verify_token.return_value = None
        
        response = client.post('/auth/reset-password', 
            data=json.dumps({
                'token': 'invalid_token',
                'new_password': 'newpassword123'
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Invalid or expired reset token' in data['error']

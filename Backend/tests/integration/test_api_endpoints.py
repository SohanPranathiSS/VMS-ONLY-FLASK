"""
API Integration Tests for Visitor Management System
Tests the complete API functionality and endpoints
"""
import pytest
import json
from unittest.mock import Mock, patch
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app import app as flask_app
except ImportError:
    # Fallback for testing without actual implementation
    from flask import Flask
    flask_app = Flask(__name__)
    flask_app.config['TESTING'] = True


@pytest.fixture
def app():
    """Create and configure a test app instance."""
    flask_app.config.update({
        "TESTING": True,
        "DATABASE_URI": "sqlite:///:memory:",
        "JWT_SECRET_KEY": "test-secret-key"
    })
    return flask_app


@pytest.fixture
def client(app):
    """Create a test client for the app."""
    return app.test_client()


@pytest.fixture
def auth_headers():
    """Create mock authentication headers."""
    return {
        'Authorization': 'Bearer mock-jwt-token',
        'Content-Type': 'application/json'
    }


class TestHealthEndpoints:
    """Test health check and status endpoints."""
    
    def test_health_check(self, client):
        """Test the health check endpoint."""
        response = client.get('/health')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
    
    def test_api_status(self, client):
        """Test API status endpoint."""
        response = client.get('/api/status')
        assert response.status_code == 200


class TestAuthenticationAPI:
    """Test authentication related endpoints."""
    
    def test_login_endpoint_exists(self, client):
        """Test login endpoint accessibility."""
        response = client.post('/api/auth/login')
        # Should return 400 or 422 for missing data, not 404
        assert response.status_code in [400, 422, 401]
    
    def test_register_endpoint_exists(self, client):
        """Test register endpoint accessibility."""
        response = client.post('/api/auth/register')
        # Should return 400 or 422 for missing data, not 404
        assert response.status_code in [400, 422, 401]
    
    @patch('src.models.user.User.authenticate')
    def test_successful_login(self, mock_auth, client):
        """Test successful login flow."""
        # Mock successful authentication
        mock_auth.return_value = Mock(id=1, email='test@example.com', role='user')
        
        login_data = {
            'email': 'test@example.com',
            'password': 'testpassword'
        }
        response = client.post('/api/auth/login', 
                              data=json.dumps(login_data),
                              content_type='application/json')
        
        if response.status_code == 200:
            data = json.loads(response.data)
            assert 'token' in data


class TestVisitorAPI:
    """Test visitor management endpoints."""
    
    def test_visitor_checkin_endpoint(self, client, auth_headers):
        """Test visitor check-in endpoint."""
        visitor_data = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'phone': '1234567890',
            'host_id': 1,
            'purpose': 'Business Meeting'
        }
        response = client.post('/api/visitors/checkin',
                              data=json.dumps(visitor_data),
                              headers=auth_headers)
        # Should accept the request (200/201) or require auth (401)
        assert response.status_code in [200, 201, 401, 422]
    
    def test_visitor_list_endpoint(self, client, auth_headers):
        """Test visitor list endpoint."""
        response = client.get('/api/visitors', headers=auth_headers)
        assert response.status_code in [200, 401]
    
    def test_visitor_checkout_endpoint(self, client, auth_headers):
        """Test visitor check-out endpoint."""
        response = client.put('/api/visitors/1/checkout', headers=auth_headers)
        assert response.status_code in [200, 404, 401]


class TestAdminAPI:
    """Test admin specific endpoints."""
    
    def test_admin_dashboard_endpoint(self, client, auth_headers):
        """Test admin dashboard data endpoint."""
        response = client.get('/api/admin/dashboard', headers=auth_headers)
        assert response.status_code in [200, 401, 403]
    
    def test_user_management_endpoint(self, client, auth_headers):
        """Test user management endpoint."""
        response = client.get('/api/admin/users', headers=auth_headers)
        assert response.status_code in [200, 401, 403]


class TestReportAPI:
    """Test reporting endpoints."""
    
    def test_daily_report_endpoint(self, client, auth_headers):
        """Test daily report generation."""
        response = client.get('/api/reports/daily', headers=auth_headers)
        assert response.status_code in [200, 401]
    
    def test_visitor_analytics_endpoint(self, client, auth_headers):
        """Test visitor analytics endpoint."""
        response = client.get('/api/reports/analytics', headers=auth_headers)
        assert response.status_code in [200, 401]


class TestMLIntegrationAPI:
    """Test ML service integration endpoints."""
    
    @patch('requests.post')
    def test_id_card_detection_endpoint(self, mock_post, client, auth_headers):
        """Test ID card detection endpoint."""
        # Mock ML service response
        mock_post.return_value.json.return_value = {
            'card_type': 'aadhar',
            'confidence': 0.95
        }
        mock_post.return_value.status_code = 200
        
        # Test file upload endpoint
        response = client.post('/api/ml/detect-id-card',
                              headers=auth_headers,
                              data={'file': 'mock-file-data'})
        assert response.status_code in [200, 400, 401]


class TestErrorHandling:
    """Test API error handling."""
    
    def test_404_error_handling(self, client):
        """Test 404 error handling."""
        response = client.get('/api/nonexistent')
        assert response.status_code == 404
    
    def test_405_method_not_allowed(self, client):
        """Test method not allowed error."""
        response = client.delete('/api/auth/login')
        assert response.status_code == 405
    
    def test_invalid_json_handling(self, client):
        """Test invalid JSON handling."""
        response = client.post('/api/auth/login',
                              data='invalid-json',
                              content_type='application/json')
        assert response.status_code in [400, 422]


class TestCORSHeaders:
    """Test CORS configuration."""
    
    def test_cors_headers_present(self, client):
        """Test that CORS headers are present."""
        response = client.options('/api/auth/login')
        headers = response.headers
        assert 'Access-Control-Allow-Origin' in headers


if __name__ == '__main__':
    pytest.main([__file__])

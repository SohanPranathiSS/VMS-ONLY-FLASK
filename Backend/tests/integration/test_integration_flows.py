"""
Integration tests for the complete application flow
"""

import pytest
from unittest.mock import patch, MagicMock
import json
from datetime import datetime

class TestIntegrationFlows:
    """Test complete application flows and integrations"""
    
    @patch('app.models.user.get_db_connection')
    @patch('app.models.visit.get_db_connection')
    @patch('app.utils.helpers.generate_qr_code')
    @patch('app.utils.helpers.send_email')
    def test_complete_visitor_registration_flow(self, mock_send_email, mock_generate_qr,
                                               mock_visit_conn, mock_user_conn, client):
        """Test complete visitor registration and check-in flow"""
        # Mock database connections
        mock_user_cursor = MagicMock()
        mock_visit_cursor = MagicMock()
        mock_user_conn.return_value.cursor.return_value = mock_user_cursor
        mock_visit_conn.return_value.cursor.return_value = mock_visit_cursor
        
        # Mock user authentication
        mock_user_cursor.fetchone.return_value = {
            'user_id': 1,
            'username': 'testuser',
            'password_hash': '$2b$12$hashed_password',
            'role': 'user'
        }
        
        # Mock visit creation
        mock_visit_cursor.lastrowid = 123
        mock_generate_qr.return_value = 'VMS-123456789-ABC123'
        mock_send_email.return_value = True
        
        # Step 1: User login
        with patch('app.routes.auth_routes.bcrypt.checkpw', return_value=True):
            login_response = client.post('/auth/login', 
                data=json.dumps({
                    'username': 'testuser',
                    'password': 'password123'
                }),
                content_type='application/json'
            )
        
        assert login_response.status_code == 200
        login_data = json.loads(login_response.data)
        access_token = login_data['access_token']
        
        # Step 2: Create visit
        visit_data = {
            'visitor_name': 'John Doe',
            'visitor_email': 'john@example.com',
            'visitor_phone': '1234567890',
            'visitor_company': 'Test Corp',
            'purpose_of_visit': 'Business Meeting',
            'host_name': 'Jane Smith',
            'host_email': 'jane@company.com',
            'host_department': 'Sales',
            'visit_date': '2025-08-05',
            'check_in_time': '09:00:00'
        }
        
        visit_response = client.post('/visits/', 
            data=json.dumps(visit_data),
            content_type='application/json',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        assert visit_response.status_code == 201
        visit_response_data = json.loads(visit_response.data)
        assert visit_response_data['visit_id'] == 123
        assert 'qr_code' in visit_response_data
        
        # Verify email was sent
        mock_send_email.assert_called()
        
        # Step 3: Check-in the visit
        mock_visit_cursor.fetchone.return_value = {
            'visit_id': 123,
            'visitor_name': 'John Doe',
            'status': 'pending'
        }
        
        checkin_response = client.post('/visits/123/check-in',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        assert checkin_response.status_code == 200
        checkin_data = json.loads(checkin_response.data)
        assert 'checked in successfully' in checkin_data['message']
    
    @patch('app.models.user.get_db_connection')
    def test_admin_user_management_flow(self, mock_conn, client):
        """Test complete admin user management flow"""
        mock_cursor = MagicMock()
        mock_conn.return_value.cursor.return_value = mock_cursor
        
        # Mock admin user
        mock_cursor.fetchone.side_effect = [
            # First call for login
            {
                'user_id': 1,
                'username': 'admin',
                'password_hash': '$2b$12$hashed_password',
                'role': 'admin'
            },
            # Second call for authorization check
            {'role': 'admin'},
            # Third call for getting user by ID
            {
                'user_id': 2,
                'username': 'testuser',
                'email': 'test@example.com',
                'role': 'user'
            }
        ]
        
        # Step 1: Admin login
        with patch('app.routes.auth_routes.bcrypt.checkpw', return_value=True):
            login_response = client.post('/auth/login', 
                data=json.dumps({
                    'username': 'admin',
                    'password': 'adminpass123'
                }),
                content_type='application/json'
            )
        
        assert login_response.status_code == 200
        login_data = json.loads(login_response.data)
        access_token = login_data['access_token']
        
        # Step 2: Get all users
        mock_cursor.fetchall.return_value = [
            {'user_id': 1, 'username': 'admin', 'role': 'admin'},
            {'user_id': 2, 'username': 'testuser', 'role': 'user'}
        ]
        
        users_response = client.get('/admin/users',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        assert users_response.status_code == 200
        users_data = json.loads(users_response.data)
        assert len(users_data['users']) == 2
        
        # Step 3: Update user
        update_response = client.put('/admin/users/2',
            data=json.dumps({
                'role': 'host',
                'email': 'newemail@example.com'
            }),
            content_type='application/json',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        assert update_response.status_code == 200
        update_data = json.loads(update_response.data)
        assert 'User updated successfully' in update_data['message']
    
    @patch('app.models.visit.get_db_connection')
    def test_visit_status_lifecycle(self, mock_conn, client):
        """Test complete visit status lifecycle"""
        mock_cursor = MagicMock()
        mock_conn.return_value.cursor.return_value = mock_cursor
        
        # Mock visit data for different states
        visit_states = [
            {'visit_id': 1, 'visitor_name': 'John Doe', 'status': 'pending'},
            {'visit_id': 1, 'visitor_name': 'John Doe', 'status': 'checked-in'},
            {'visit_id': 1, 'visitor_name': 'John Doe', 'status': 'checked-out'}
        ]
        
        # Step 1: Check initial pending status
        mock_cursor.fetchone.return_value = visit_states[0]
        
        response = client.get('/visits/1')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['visit']['status'] == 'pending'
        
        # Step 2: Check-in visit
        mock_cursor.fetchone.return_value = visit_states[0]  # Still pending for check
        
        checkin_response = client.post('/visits/1/check-in')
        assert checkin_response.status_code == 200
        
        # Step 3: Verify checked-in status
        mock_cursor.fetchone.return_value = visit_states[1]
        
        response = client.get('/visits/1')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['visit']['status'] == 'checked-in'
        
        # Step 4: Check-out visit
        mock_cursor.fetchone.return_value = visit_states[1]  # Still checked-in for check
        
        checkout_response = client.post('/visits/1/check-out')
        assert checkout_response.status_code == 200
        
        # Step 5: Verify checked-out status
        mock_cursor.fetchone.return_value = visit_states[2]
        
        response = client.get('/visits/1')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['visit']['status'] == 'checked-out'
    
    @patch('app.models.visit.get_db_connection')
    @patch('app.models.user.get_db_connection')
    def test_host_dashboard_workflow(self, mock_user_conn, mock_visit_conn, client):
        """Test host dashboard workflow"""
        mock_user_cursor = MagicMock()
        mock_visit_cursor = MagicMock()
        mock_user_conn.return_value.cursor.return_value = mock_user_cursor
        mock_visit_conn.return_value.cursor.return_value = mock_visit_cursor
        
        # Mock host user
        mock_user_cursor.fetchone.return_value = {
            'user_id': 1,
            'username': 'host',
            'password_hash': '$2b$12$hashed_password',
            'role': 'host',
            'email': 'host@company.com'
        }
        
        # Step 1: Host login
        with patch('app.routes.auth_routes.bcrypt.checkpw', return_value=True):
            login_response = client.post('/auth/login', 
                data=json.dumps({
                    'username': 'host',
                    'password': 'hostpass123'
                }),
                content_type='application/json'
            )
        
        assert login_response.status_code == 200
        login_data = json.loads(login_response.data)
        access_token = login_data['access_token']
        
        # Step 2: Get host's visits
        mock_visit_cursor.fetchall.return_value = [
            {
                'visit_id': 1,
                'visitor_name': 'John Doe',
                'host_email': 'host@company.com',
                'status': 'pending'
            },
            {
                'visit_id': 2,
                'visitor_name': 'Jane Smith',
                'host_email': 'host@company.com',
                'status': 'checked-in'
            }
        ]
        
        visits_response = client.get('/visits/host/host@company.com',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        assert visits_response.status_code == 200
        visits_data = json.loads(visits_response.data)
        assert len(visits_data['visits']) == 2
        assert all(visit['host_email'] == 'host@company.com' for visit in visits_data['visits'])
    
    @patch('app.models.visit.get_db_connection')
    def test_visit_search_and_filtering(self, mock_conn, client):
        """Test visit search and filtering functionality"""
        mock_cursor = MagicMock()
        mock_conn.return_value.cursor.return_value = mock_cursor
        
        # Mock filtered results
        mock_cursor.fetchall.return_value = [
            {
                'visit_id': 1,
                'visitor_name': 'John Doe',
                'status': 'checked-in',
                'visit_date': '2025-08-05'
            }
        ]
        
        # Test with multiple filters
        response = client.get('/visits/?status=checked-in&date_from=2025-08-01&date_to=2025-08-10&host_email=host@company.com')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['visits']) == 1
        assert data['visits'][0]['status'] == 'checked-in'
        
        # Verify that filters were applied in the query
        mock_cursor.execute.assert_called_once()
        call_args = mock_cursor.execute.call_args
        query = call_args[0][0]
        params = call_args[0][1]
        
        # Check that WHERE clause and parameters are correctly formed
        assert 'WHERE' in query
        assert len(params) == 4  # Four filter parameters
    
    def test_error_handling_integration(self, client):
        """Test error handling across different components"""
        # Test 404 for non-existent visit
        response = client.get('/visits/99999')
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Visit not found' in data['error']
        
        # Test 400 for invalid data
        response = client.post('/visits/', 
            data=json.dumps({}),  # Empty data
            content_type='application/json'
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        
        # Test 401 for unauthorized access
        response = client.get('/admin/users')
        assert response.status_code == 401
    
    @patch('app.utils.helpers.generate_qr_code')
    @patch('app.utils.helpers.send_email')
    def test_utility_integrations(self, mock_send_email, mock_generate_qr, client):
        """Test integration of utility functions"""
        from app.utils.helpers import generate_qr_code, send_email
        
        # Test QR code generation
        mock_generate_qr.return_value = "VMS-123456789-ABC123"
        
        qr_data = "VMS-123456789-ABC123"
        result = generate_qr_code(qr_data)
        assert result == qr_data
        mock_generate_qr.assert_called_with(qr_data)
        
        # Test email sending
        mock_send_email.return_value = True
        
        email_result = send_email(
            to_email="test@example.com",
            subject="Test Subject",
            body="Test Body"
        )
        assert email_result is True
        mock_send_email.assert_called_once()

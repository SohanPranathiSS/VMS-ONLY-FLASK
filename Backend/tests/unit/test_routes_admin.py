"""
Comprehensive tests for Admin Routes
"""

import pytest
from unittest.mock import patch, MagicMock
import json

class TestAdminRoutes:
    """Test admin blueprint routes"""
    
    @patch('app.routes.admin_routes.jwt_required')
    @patch('app.routes.admin_routes.get_jwt_identity')
    @patch('app.routes.admin_routes.User.get_user_by_username')
    @patch('app.routes.admin_routes.User.get_all_users')
    def test_get_all_users_success(self, mock_get_all, mock_get_user, 
                                  mock_get_identity, mock_jwt_required, client):
        """Test successful retrieval of all users by admin"""
        mock_get_identity.return_value = 'admin'
        mock_get_user.return_value = {'role': 'admin'}
        mock_get_all.return_value = [
            {'user_id': 1, 'username': 'user1', 'role': 'user'},
            {'user_id': 2, 'username': 'user2', 'role': 'host'}
        ]
        
        response = client.get('/admin/users',
            headers={'Authorization': 'Bearer fake_token'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['users']) == 2
        assert data['users'][0]['username'] == 'user1'
    
    @patch('app.routes.admin_routes.jwt_required')
    @patch('app.routes.admin_routes.get_jwt_identity')
    @patch('app.routes.admin_routes.User.get_user_by_username')
    def test_get_all_users_unauthorized(self, mock_get_user, mock_get_identity, 
                                       mock_jwt_required, client):
        """Test getting all users with non-admin user"""
        mock_get_identity.return_value = 'user'
        mock_get_user.return_value = {'role': 'user'}
        
        response = client.get('/admin/users',
            headers={'Authorization': 'Bearer fake_token'}
        )
        
        assert response.status_code == 403
        data = json.loads(response.data)
        assert 'Access denied' in data['error']
    
    @patch('app.routes.admin_routes.jwt_required')
    @patch('app.routes.admin_routes.get_jwt_identity')
    @patch('app.routes.admin_routes.User.get_user_by_username')
    @patch('app.routes.admin_routes.User.get_user_by_id')
    def test_get_user_by_id_success(self, mock_get_by_id, mock_get_user, 
                                   mock_get_identity, mock_jwt_required, client):
        """Test successful retrieval of user by ID"""
        mock_get_identity.return_value = 'admin'
        mock_get_user.return_value = {'role': 'admin'}
        mock_get_by_id.return_value = {
            'user_id': 1,
            'username': 'testuser',
            'email': 'test@example.com',
            'role': 'user'
        }
        
        response = client.get('/admin/users/1',
            headers={'Authorization': 'Bearer fake_token'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['user']['username'] == 'testuser'
        assert data['user']['user_id'] == 1
    
    @patch('app.routes.admin_routes.jwt_required')
    @patch('app.routes.admin_routes.get_jwt_identity')
    @patch('app.routes.admin_routes.User.get_user_by_username')
    @patch('app.routes.admin_routes.User.get_user_by_id')
    def test_get_user_by_id_not_found(self, mock_get_by_id, mock_get_user, 
                                     mock_get_identity, mock_jwt_required, client):
        """Test getting user by ID when user doesn't exist"""
        mock_get_identity.return_value = 'admin'
        mock_get_user.return_value = {'role': 'admin'}
        mock_get_by_id.return_value = None
        
        response = client.get('/admin/users/999',
            headers={'Authorization': 'Bearer fake_token'}
        )
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'User not found' in data['error']
    
    @patch('app.routes.admin_routes.jwt_required')
    @patch('app.routes.admin_routes.get_jwt_identity')
    @patch('app.routes.admin_routes.User.get_user_by_username')
    @patch('app.routes.admin_routes.User.update_user')
    @patch('app.routes.admin_routes.User.get_user_by_id')
    def test_update_user_success(self, mock_get_by_id, mock_update, mock_get_user, 
                                mock_get_identity, mock_jwt_required, client):
        """Test successful user update by admin"""
        mock_get_identity.return_value = 'admin'
        mock_get_user.return_value = {'role': 'admin'}
        mock_get_by_id.return_value = {'user_id': 1, 'username': 'testuser'}
        mock_update.return_value = True
        
        update_data = {
            'email': 'newemail@example.com',
            'role': 'host',
            'full_name': 'Updated Name'
        }
        
        response = client.put('/admin/users/1',
            data=json.dumps(update_data),
            content_type='application/json',
            headers={'Authorization': 'Bearer fake_token'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'User updated successfully' in data['message']
    
    @patch('app.routes.admin_routes.jwt_required')
    @patch('app.routes.admin_routes.get_jwt_identity')
    @patch('app.routes.admin_routes.User.get_user_by_username')
    @patch('app.routes.admin_routes.User.get_user_by_id')
    def test_update_user_not_found(self, mock_get_by_id, mock_get_user, 
                                  mock_get_identity, mock_jwt_required, client):
        """Test updating non-existent user"""
        mock_get_identity.return_value = 'admin'
        mock_get_user.return_value = {'role': 'admin'}
        mock_get_by_id.return_value = None
        
        update_data = {
            'email': 'newemail@example.com'
        }
        
        response = client.put('/admin/users/999',
            data=json.dumps(update_data),
            content_type='application/json',
            headers={'Authorization': 'Bearer fake_token'}
        )
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'User not found' in data['error']
    
    @patch('app.routes.admin_routes.jwt_required')
    @patch('app.routes.admin_routes.get_jwt_identity')
    @patch('app.routes.admin_routes.User.get_user_by_username')
    @patch('app.routes.admin_routes.User.delete_user')
    @patch('app.routes.admin_routes.User.get_user_by_id')
    def test_delete_user_success(self, mock_get_by_id, mock_delete, mock_get_user, 
                                mock_get_identity, mock_jwt_required, client):
        """Test successful user deletion by admin"""
        mock_get_identity.return_value = 'admin'
        mock_get_user.return_value = {'role': 'admin'}
        mock_get_by_id.return_value = {'user_id': 1, 'username': 'testuser'}
        mock_delete.return_value = True
        
        response = client.delete('/admin/users/1',
            headers={'Authorization': 'Bearer fake_token'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'User deleted successfully' in data['message']
    
    @patch('app.routes.admin_routes.jwt_required')
    @patch('app.routes.admin_routes.get_jwt_identity')
    @patch('app.routes.admin_routes.User.get_user_by_username')
    @patch('app.routes.admin_routes.User.get_user_by_id')
    def test_delete_user_not_found(self, mock_get_by_id, mock_get_user, 
                                  mock_get_identity, mock_jwt_required, client):
        """Test deleting non-existent user"""
        mock_get_identity.return_value = 'admin'
        mock_get_user.return_value = {'role': 'admin'}
        mock_get_by_id.return_value = None
        
        response = client.delete('/admin/users/999',
            headers={'Authorization': 'Bearer fake_token'}
        )
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'User not found' in data['error']
    
    @patch('app.routes.admin_routes.jwt_required')
    @patch('app.routes.admin_routes.get_jwt_identity')
    @patch('app.routes.admin_routes.User.get_user_by_username')
    @patch('app.routes.admin_routes.Visit.get_all_visits')
    def test_get_all_visits_admin(self, mock_get_visits, mock_get_user, 
                                 mock_get_identity, mock_jwt_required, client):
        """Test admin getting all visits"""
        mock_get_identity.return_value = 'admin'
        mock_get_user.return_value = {'role': 'admin'}
        mock_get_visits.return_value = [
            {'visit_id': 1, 'visitor_name': 'John Doe'},
            {'visit_id': 2, 'visitor_name': 'Jane Smith'}
        ]
        
        response = client.get('/admin/visits',
            headers={'Authorization': 'Bearer fake_token'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['visits']) == 2
    
    @patch('app.routes.admin_routes.jwt_required')
    @patch('app.routes.admin_routes.get_jwt_identity')
    @patch('app.routes.admin_routes.User.get_user_by_username')
    @patch('app.routes.admin_routes.Visit.get_visit_counts')
    @patch('app.routes.admin_routes.User.get_user_stats')
    def test_get_dashboard_stats_success(self, mock_user_stats, mock_visit_counts, 
                                        mock_get_user, mock_get_identity, 
                                        mock_jwt_required, client):
        """Test getting dashboard statistics"""
        mock_get_identity.return_value = 'admin'
        mock_get_user.return_value = {'role': 'admin'}
        mock_visit_counts.return_value = {
            'total_visits': 100,
            'checked_in': 25,
            'checked_out': 70,
            'today_visits': 15
        }
        mock_user_stats.return_value = {
            'total_users': 50,
            'active_users': 45,
            'admins': 5
        }
        
        response = client.get('/admin/dashboard/stats',
            headers={'Authorization': 'Bearer fake_token'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['stats']['visits']['total_visits'] == 100
        assert data['stats']['users']['total_users'] == 50
    
    @patch('app.routes.admin_routes.jwt_required')
    @patch('app.routes.admin_routes.get_jwt_identity')
    @patch('app.routes.admin_routes.User.get_user_by_username')
    def test_admin_route_access_denied_for_user(self, mock_get_user, mock_get_identity, 
                                               mock_jwt_required, client):
        """Test that regular users cannot access admin routes"""
        mock_get_identity.return_value = 'user'
        mock_get_user.return_value = {'role': 'user'}
        
        response = client.get('/admin/users',
            headers={'Authorization': 'Bearer fake_token'}
        )
        
        assert response.status_code == 403
        data = json.loads(response.data)
        assert 'Access denied' in data['error']
    
    @patch('app.routes.admin_routes.jwt_required')
    @patch('app.routes.admin_routes.get_jwt_identity')
    @patch('app.routes.admin_routes.User.get_user_by_username')
    def test_admin_route_access_denied_for_host(self, mock_get_user, mock_get_identity, 
                                               mock_jwt_required, client):
        """Test that host users cannot access admin routes"""
        mock_get_identity.return_value = 'host'
        mock_get_user.return_value = {'role': 'host'}
        
        response = client.get('/admin/users',
            headers={'Authorization': 'Bearer fake_token'}
        )
        
        assert response.status_code == 403
        data = json.loads(response.data)
        assert 'Access denied' in data['error']

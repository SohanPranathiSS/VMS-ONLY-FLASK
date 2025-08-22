"""
Comprehensive tests for Visits Routes
"""

import pytest
from unittest.mock import patch, MagicMock
import json
from datetime import datetime

class TestVisitsRoutes:
    """Test visits blueprint routes"""
    
    @patch('app.routes.visit_routes.Visit.create_visit')
    @patch('app.routes.visit_routes.generate_qr_code')
    @patch('app.routes.visit_routes.send_email')
    def test_create_visit_success(self, mock_send_email, mock_generate_qr, 
                                 mock_create_visit, client):
        """Test successful visit creation"""
        mock_generate_qr.return_value = 'VMS-123456789-ABC123'
        mock_create_visit.return_value = 456
        mock_send_email.return_value = True
        
        visit_data = {
            'visitor_name': 'John Doe',
            'visitor_email': 'john@example.com',
            'visitor_phone': '1234567890',
            'visitor_company': 'Test Corp',
            'purpose_of_visit': 'Meeting',
            'host_name': 'Jane Smith',
            'host_email': 'jane@example.com',
            'host_department': 'Sales',
            'visit_date': '2025-08-05',
            'check_in_time': '09:00:00'
        }
        
        response = client.post('/visits/', 
            data=json.dumps(visit_data),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Visit created successfully'
        assert data['visit_id'] == 456
        assert 'qr_code' in data
    
    def test_create_visit_missing_data(self, client):
        """Test visit creation with missing required data"""
        incomplete_data = {
            'visitor_name': 'John Doe',
            # Missing other required fields
        }
        
        response = client.post('/visits/', 
            data=json.dumps(incomplete_data),
            content_type='application/json'
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    @patch('app.routes.visit_routes.Visit.create_visit')
    def test_create_visit_database_error(self, mock_create_visit, client):
        """Test visit creation with database error"""
        mock_create_visit.side_effect = Exception("Database error")
        
        visit_data = {
            'visitor_name': 'John Doe',
            'visitor_email': 'john@example.com',
            'visitor_phone': '1234567890',
            'visitor_company': 'Test Corp',
            'purpose_of_visit': 'Meeting',
            'host_name': 'Jane Smith',
            'host_email': 'jane@example.com',
            'host_department': 'Sales',
            'visit_date': '2025-08-05',
            'check_in_time': '09:00:00'
        }
        
        response = client.post('/visits/', 
            data=json.dumps(visit_data),
            content_type='application/json'
        )
        
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data
    
    @patch('app.routes.visit_routes.Visit.get_all_visits')
    def test_get_all_visits_no_filters(self, mock_get_all, client):
        """Test getting all visits without filters"""
        mock_get_all.return_value = [
            {'visit_id': 1, 'visitor_name': 'John Doe', 'status': 'checked-in'},
            {'visit_id': 2, 'visitor_name': 'Jane Smith', 'status': 'checked-out'}
        ]
        
        response = client.get('/visits/')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['visits']) == 2
        assert data['visits'][0]['visitor_name'] == 'John Doe'
    
    @patch('app.routes.visit_routes.Visit.get_all_visits')
    def test_get_all_visits_with_filters(self, mock_get_all, client):
        """Test getting all visits with filters"""
        mock_get_all.return_value = [
            {'visit_id': 1, 'visitor_name': 'John Doe', 'status': 'checked-in'}
        ]
        
        response = client.get('/visits/?status=checked-in&date_from=2025-08-01&date_to=2025-08-05')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['visits']) == 1
        # Verify filters were passed to the model
        mock_get_all.assert_called_once_with({
            'status': 'checked-in',
            'date_from': '2025-08-01',
            'date_to': '2025-08-05'
        })
    
    @patch('app.routes.visit_routes.Visit.get_visit_by_id')
    def test_get_visit_by_id_found(self, mock_get_visit, client):
        """Test getting visit by ID when visit exists"""
        mock_get_visit.return_value = {
            'visit_id': 1,
            'visitor_name': 'John Doe',
            'status': 'checked-in'
        }
        
        response = client.get('/visits/1')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['visit']['visit_id'] == 1
        assert data['visit']['visitor_name'] == 'John Doe'
    
    @patch('app.routes.visit_routes.Visit.get_visit_by_id')
    def test_get_visit_by_id_not_found(self, mock_get_visit, client):
        """Test getting visit by ID when visit doesn't exist"""
        mock_get_visit.return_value = None
        
        response = client.get('/visits/999')
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Visit not found' in data['error']
    
    @patch('app.routes.visit_routes.Visit.update_visit_status')
    @patch('app.routes.visit_routes.Visit.get_visit_by_id')
    def test_update_visit_status_success(self, mock_get_visit, mock_update_status, client):
        """Test successful visit status update"""
        mock_get_visit.return_value = {
            'visit_id': 1,
            'visitor_name': 'John Doe',
            'status': 'pending'
        }
        mock_update_status.return_value = True
        
        response = client.put('/visits/1/status', 
            data=json.dumps({
                'status': 'checked-in'
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'Status updated successfully' in data['message']
    
    @patch('app.routes.visit_routes.Visit.get_visit_by_id')
    def test_update_visit_status_not_found(self, mock_get_visit, client):
        """Test updating status of non-existent visit"""
        mock_get_visit.return_value = None
        
        response = client.put('/visits/999/status', 
            data=json.dumps({
                'status': 'checked-in'
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Visit not found' in data['error']
    
    def test_update_visit_status_invalid_status(self, client):
        """Test updating visit with invalid status"""
        response = client.put('/visits/1/status', 
            data=json.dumps({
                'status': 'invalid_status'
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Invalid status' in data['error']
    
    @patch('app.routes.visit_routes.Visit.update_visit_status')
    @patch('app.routes.visit_routes.Visit.get_visit_by_id')
    def test_check_in_visit_success(self, mock_get_visit, mock_update_status, client):
        """Test successful visit check-in"""
        mock_get_visit.return_value = {
            'visit_id': 1,
            'visitor_name': 'John Doe',
            'status': 'pending'
        }
        mock_update_status.return_value = True
        
        response = client.post('/visits/1/check-in')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'checked in successfully' in data['message']
    
    @patch('app.routes.visit_routes.Visit.get_visit_by_id')
    def test_check_in_visit_already_checked_in(self, mock_get_visit, client):
        """Test checking in already checked-in visit"""
        mock_get_visit.return_value = {
            'visit_id': 1,
            'visitor_name': 'John Doe',
            'status': 'checked-in'
        }
        
        response = client.post('/visits/1/check-in')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'already checked in' in data['error']
    
    @patch('app.routes.visit_routes.Visit.update_visit_status')
    @patch('app.routes.visit_routes.Visit.get_visit_by_id')
    def test_check_out_visit_success(self, mock_get_visit, mock_update_status, client):
        """Test successful visit check-out"""
        mock_get_visit.return_value = {
            'visit_id': 1,
            'visitor_name': 'John Doe',
            'status': 'checked-in'
        }
        mock_update_status.return_value = True
        
        response = client.post('/visits/1/check-out')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'checked out successfully' in data['message']
    
    @patch('app.routes.visit_routes.Visit.get_visit_by_id')
    def test_check_out_visit_not_checked_in(self, mock_get_visit, client):
        """Test checking out visit that's not checked in"""
        mock_get_visit.return_value = {
            'visit_id': 1,
            'visitor_name': 'John Doe',
            'status': 'pending'
        }
        
        response = client.post('/visits/1/check-out')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'not checked in' in data['error']
    
    @patch('app.routes.visit_routes.Visit.get_visit_counts')
    def test_get_visit_stats_success(self, mock_get_counts, client):
        """Test getting visit statistics"""
        mock_get_counts.return_value = {
            'total_visits': 100,
            'checked_in': 25,
            'checked_out': 70,
            'pending': 5,
            'today_visits': 15
        }
        
        response = client.get('/visits/stats')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['stats']['total_visits'] == 100
        assert data['stats']['checked_in'] == 25
        assert data['stats']['today_visits'] == 15
    
    @patch('app.routes.visit_routes.Visit.get_visit_counts')
    def test_get_visit_stats_database_error(self, mock_get_counts, client):
        """Test getting visit statistics with database error"""
        mock_get_counts.return_value = {}
        
        response = client.get('/visits/stats')
        
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data

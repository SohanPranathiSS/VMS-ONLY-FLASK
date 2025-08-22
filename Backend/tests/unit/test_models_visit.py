"""
Comprehensive tests for Visit Model
"""

import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime
from app.models.visit import Visit

class TestVisitModel:
    """Test Visit model functionality"""
    
    @patch('app.models.visit.get_db_connection')
    def test_create_visit_success(self, mock_get_conn):
        """Test successful visit creation"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.lastrowid = 456
        mock_get_conn.return_value = mock_conn
        
        visitor_data = {
            'visitor_name': 'John Doe',
            'visitor_email': 'john@example.com',
            'visitor_phone': '1234567890',
            'visitor_company': 'Test Corp',
            'purpose_of_visit': 'Meeting',
            'host_name': 'Jane Smith',
            'host_email': 'jane@example.com',
            'host_department': 'Sales',
            'visit_date': '2025-08-05',
            'check_in_time': '09:00:00',
            'qr_code': 'VMS-123456789-ABC123',
            'status': 'checked-in'
        }
        
        visit_id = Visit.create_visit(visitor_data)
        
        assert visit_id == 456
        mock_cursor.execute.assert_called_once()
        mock_cursor.close.assert_called_once()
        mock_conn.close.assert_called_once()
    
    @patch('app.models.visit.get_db_connection')
    def test_create_visit_database_error(self, mock_get_conn):
        """Test visit creation with database error"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.execute.side_effect = Exception("Database error")
        mock_get_conn.return_value = mock_conn
        
        visitor_data = {
            'visitor_name': 'John Doe',
            'visitor_email': 'john@example.com'
        }
        
        with pytest.raises(Exception):
            Visit.create_visit(visitor_data)
        
        mock_cursor.close.assert_called_once()
        mock_conn.close.assert_called_once()
    
    @patch('app.models.visit.get_db_connection')
    def test_get_visit_by_id_found(self, mock_get_conn):
        """Test getting visit by ID when visit exists"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = {
            'visit_id': 1,
            'visitor_name': 'John Doe',
            'status': 'checked-in'
        }
        mock_get_conn.return_value = mock_conn
        
        visit = Visit.get_visit_by_id(1)
        
        assert visit is not None
        assert visit['visit_id'] == 1
        assert visit['visitor_name'] == 'John Doe'
        mock_cursor.execute.assert_called_once_with("SELECT * FROM visits WHERE visit_id = %s", (1,))
    
    @patch('app.models.visit.get_db_connection')
    def test_get_visit_by_id_not_found(self, mock_get_conn):
        """Test getting visit by ID when visit doesn't exist"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = None
        mock_get_conn.return_value = mock_conn
        
        visit = Visit.get_visit_by_id(999)
        
        assert visit is None
    
    @patch('app.models.visit.get_db_connection')
    def test_get_all_visits_no_filters(self, mock_get_conn):
        """Test getting all visits without filters"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchall.return_value = [
            {'visit_id': 1, 'visitor_name': 'John Doe', 'status': 'checked-in'},
            {'visit_id': 2, 'visitor_name': 'Jane Smith', 'status': 'checked-out'}
        ]
        mock_get_conn.return_value = mock_conn
        
        visits = Visit.get_all_visits()
        
        assert len(visits) == 2
        assert visits[0]['visitor_name'] == 'John Doe'
        mock_cursor.execute.assert_called_once()
        # Verify the base query and ordering
        call_args = mock_cursor.execute.call_args[0]
        assert 'ORDER BY visit_date DESC, check_in_time DESC' in call_args[0]
    
    @patch('app.models.visit.get_db_connection')
    def test_get_all_visits_with_filters(self, mock_get_conn):
        """Test getting all visits with filters"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchall.return_value = [
            {'visit_id': 1, 'visitor_name': 'John Doe', 'status': 'checked-in'}
        ]
        mock_get_conn.return_value = mock_conn
        
        filters = {
            'status': 'checked-in',
            'date_from': '2025-08-01',
            'date_to': '2025-08-05',
            'host_email': 'host@example.com'
        }
        
        visits = Visit.get_all_visits(filters)
        
        assert len(visits) == 1
        mock_cursor.execute.assert_called_once()
        # Verify filters are applied
        call_args = mock_cursor.execute.call_args
        assert 'WHERE' in call_args[0][0]
        assert len(call_args[0][1]) == 4  # Four filter parameters
    
    @patch('app.models.visit.get_db_connection')
    def test_update_visit_status_with_checkout(self, mock_get_conn):
        """Test updating visit status with checkout time"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_get_conn.return_value = mock_conn
        
        checkout_time = datetime.now()
        result = Visit.update_visit_status(1, 'checked-out', checkout_time)
        
        assert result is True
        mock_cursor.execute.assert_called_once()
        # Verify the correct SQL with checkout time
        call_args = mock_cursor.execute.call_args[0]
        assert 'check_out_time = %s' in call_args[0]
        assert call_args[1] == ('checked-out', checkout_time, 1)
    
    @patch('app.models.visit.get_db_connection')
    def test_update_visit_status_without_checkout(self, mock_get_conn):
        """Test updating visit status without checkout time"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_get_conn.return_value = mock_conn
        
        result = Visit.update_visit_status(1, 'pending')
        
        assert result is True
        mock_cursor.execute.assert_called_once()
        # Verify the correct SQL without checkout time
        call_args = mock_cursor.execute.call_args[0]
        assert 'check_out_time' not in call_args[0]
        assert call_args[1] == ('pending', 1)
    
    @patch('app.models.visit.get_db_connection')
    def test_get_visit_counts_success(self, mock_get_conn):
        """Test getting visit counts successfully"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = {
            'total_visits': 100,
            'checked_in': 25,
            'checked_out': 70,
            'pending': 5,
            'today_visits': 15
        }
        mock_get_conn.return_value = mock_conn
        
        counts = Visit.get_visit_counts()
        
        assert counts['total_visits'] == 100
        assert counts['checked_in'] == 25
        assert counts['checked_out'] == 70
        assert counts['pending'] == 5
        assert counts['today_visits'] == 15
        mock_cursor.execute.assert_called_once()
        # Verify the query uses COUNT and CASE statements
        call_args = mock_cursor.execute.call_args[0][0]
        assert 'COUNT(*) as total_visits' in call_args
        assert 'COUNT(CASE WHEN status' in call_args
    
    @patch('app.models.visit.get_db_connection')
    def test_get_host_visits_success(self, mock_get_conn):
        """Test getting visits for a specific host"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchall.return_value = [
            {'visit_id': 1, 'visitor_name': 'John Doe', 'host_email': 'host@example.com'},
            {'visit_id': 2, 'visitor_name': 'Jane Smith', 'host_email': 'host@example.com'}
        ]
        mock_get_conn.return_value = mock_conn
        
        visits = Visit.get_host_visits('host@example.com')
        
        assert len(visits) == 2
        assert all(visit['host_email'] == 'host@example.com' for visit in visits)
        mock_cursor.execute.assert_called_once()
        # Verify the query filters by host_email
        call_args = mock_cursor.execute.call_args
        assert 'WHERE host_email = %s' in call_args[0][0]
        assert call_args[0][1] == ('host@example.com',)
    
    @patch('app.models.visit.get_db_connection')
    def test_get_visit_counts_database_error(self, mock_get_conn):
        """Test getting visit counts with database error"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.execute.side_effect = Exception("Database error")
        mock_get_conn.return_value = mock_conn
        
        counts = Visit.get_visit_counts()
        
        assert counts == {}
        mock_cursor.close.assert_called_once()
        mock_conn.close.assert_called_once()

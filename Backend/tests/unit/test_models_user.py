"""
Comprehensive tests for User Model
"""

import pytest
from unittest.mock import patch, MagicMock
from app.models.user import User

class TestUserModel:
    """Test User model functionality"""
    
    @patch('app.models.user.get_db_connection')
    def test_create_user_success(self, mock_get_conn):
        """Test successful user creation"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.lastrowid = 123
        mock_get_conn.return_value = mock_conn
        
        user_id = User.create_user(
            email='test@example.com',
            password='password123',
            full_name='Test User',
            role='host',
            company_id=1
        )
        
        assert user_id == 123
        mock_cursor.execute.assert_called_once()
        mock_cursor.close.assert_called_once()
        mock_conn.close.assert_called_once()
    
    @patch('app.models.user.get_db_connection')
    def test_create_user_database_error(self, mock_get_conn):
        """Test user creation with database error"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.execute.side_effect = Exception("Database error")
        mock_get_conn.return_value = mock_conn
        
        with pytest.raises(Exception):
            User.create_user(
                email='test@example.com',
                password='password123',
                full_name='Test User'
            )
        
        mock_cursor.close.assert_called_once()
        mock_conn.close.assert_called_once()
    
    @patch('app.models.user.get_db_connection')
    def test_get_user_by_email_found(self, mock_get_conn):
        """Test getting user by email when user exists"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = {
            'user_id': 1,
            'email': 'test@example.com',
            'full_name': 'Test User'
        }
        mock_get_conn.return_value = mock_conn
        
        user = User.get_user_by_email('test@example.com')
        
        assert user is not None
        assert user['email'] == 'test@example.com'
        mock_cursor.execute.assert_called_once()
        mock_cursor.close.assert_called_once()
        mock_conn.close.assert_called_once()
    
    @patch('app.models.user.get_db_connection')
    def test_get_user_by_email_not_found(self, mock_get_conn):
        """Test getting user by email when user doesn't exist"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = None
        mock_get_conn.return_value = mock_conn
        
        user = User.get_user_by_email('nonexistent@example.com')
        
        assert user is None
    
    @patch('app.models.user.get_db_connection')
    def test_get_user_by_id_found(self, mock_get_conn):
        """Test getting user by ID when user exists"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = {
            'user_id': 1,
            'email': 'test@example.com',
            'full_name': 'Test User'
        }
        mock_get_conn.return_value = mock_conn
        
        user = User.get_user_by_id(1)
        
        assert user is not None
        assert user['user_id'] == 1
        mock_cursor.execute.assert_called_once_with("SELECT * FROM users WHERE user_id = %s", (1,))
    
    @patch('app.models.user.get_db_connection')
    def test_verify_user_email_success(self, mock_get_conn):
        """Test successful email verification"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_get_conn.return_value = mock_conn
        
        result = User.verify_user_email(1)
        
        assert result is True
        mock_cursor.execute.assert_called_once_with("UPDATE users SET is_verified = TRUE WHERE user_id = %s", (1,))
    
    @patch('app.models.user.get_db_connection')
    def test_update_user_success(self, mock_get_conn):
        """Test successful user update"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_get_conn.return_value = mock_conn
        
        updates = {'full_name': 'Updated Name', 'role': 'admin'}
        result = User.update_user(1, updates)
        
        assert result is True
        mock_cursor.execute.assert_called_once()
        # Verify the SQL contains the correct SET clause
        call_args = mock_cursor.execute.call_args[0]
        assert 'full_name = %s, role = %s' in call_args[0]
        assert call_args[1] == ['Updated Name', 'admin', 1]
    
    def test_verify_password_correct(self):
        """Test password verification with correct password"""
        from werkzeug.security import generate_password_hash
        
        user = {
            'password': generate_password_hash('correct_password')
        }
        
        result = User.verify_password(user, 'correct_password')
        
        assert result is True
    
    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password"""
        from werkzeug.security import generate_password_hash
        
        user = {
            'password': generate_password_hash('correct_password')
        }
        
        result = User.verify_password(user, 'wrong_password')
        
        assert result is False
    
    @patch('app.models.user.get_db_connection')
    def test_get_all_users_success(self, mock_get_conn):
        """Test getting all users successfully"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchall.return_value = [
            {'user_id': 1, 'email': 'user1@example.com', 'role': 'admin'},
            {'user_id': 2, 'email': 'user2@example.com', 'role': 'host'}
        ]
        mock_get_conn.return_value = mock_conn
        
        users = User.get_all_users()
        
        assert len(users) == 2
        assert users[0]['email'] == 'user1@example.com'
        assert users[1]['role'] == 'host'
        mock_cursor.execute.assert_called_once()
        # Verify the query includes proper fields and ordering
        call_args = mock_cursor.execute.call_args[0][0]
        assert 'ORDER BY created_at DESC' in call_args
    
    @patch('app.models.user.get_db_connection')
    def test_get_all_users_database_error(self, mock_get_conn):
        """Test getting all users with database error"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.execute.side_effect = Exception("Database error")
        mock_get_conn.return_value = mock_conn
        
        users = User.get_all_users()
        
        assert users == []
        mock_cursor.close.assert_called_once()
        mock_conn.close.assert_called_once()

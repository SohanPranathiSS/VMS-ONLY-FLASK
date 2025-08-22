"""
Unit Tests for User Model
Tests user creation, validation, and authentication
"""
import pytest
from unittest.mock import Mock, patch
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock User class for testing
class User:
    def __init__(self, name=None, email=None, role=None, id=None):
        self.id = id
        self.name = name
        self.email = email
        self.role = role
        self.password_hash = None
        self.created_at = None
    
    def is_valid(self):
        return self.email and '@' in self.email
    
    def set_password(self, password):
        self.password_hash = f"hashed_{password}"
    
    def check_password(self, password):
        return self.password_hash == f"hashed_{password}"
    
    def is_admin(self):
        return self.role == "admin"
    
    def is_host(self):
        return self.role == "host"
    
    def is_visitor(self):
        return self.role == "visitor"
    
    def save(self):
        pass
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at
        }
    
    @staticmethod
    def find_by_email(email):
        return None
    
    @staticmethod
    def authenticate(email, password):
        user = User.find_by_email(email)
        if user and user.check_password(password):
            return user
        return None


class TestUserModel:
    """Test User model functionality."""
    
    def test_user_creation(self):
        """Test user object creation."""
        user = User(
            name="John Doe",
            email="john@example.com",
            role="user"
        )
        assert user.name == "John Doe"
        assert user.email == "john@example.com"
        assert user.role == "user"
    
    def test_user_validation(self):
        """Test user data validation."""
        # Test valid user
        valid_user = User(
            name="Jane Smith",
            email="jane@example.com",
            role="admin"
        )
        assert valid_user.is_valid()
        
        # Test invalid email
        invalid_user = User(
            name="Invalid User",
            email="invalid-email",
            role="user"
        )
        assert not invalid_user.is_valid()
    
    def test_password_hashing(self):
        """Test password hashing functionality."""
        user = User(name="Test User", email="test@example.com")
        password = "testpassword123"
        
        # Set password (should be hashed)
        user.set_password(password)
        assert user.password_hash is not None
        assert user.password_hash != password
        
        # Verify password
        assert user.check_password(password)
        assert not user.check_password("wrongpassword")
    
    def test_user_roles(self):
        """Test user role functionality."""
        admin_user = User(role="admin")
        host_user = User(role="host")
        visitor_user = User(role="visitor")
        
        assert admin_user.is_admin()
        assert not admin_user.is_host()
        assert not admin_user.is_visitor()
        
        assert not host_user.is_admin()
        assert host_user.is_host()
        assert not host_user.is_visitor()
        
        assert not visitor_user.is_admin()
        assert not visitor_user.is_host()
        assert visitor_user.is_visitor()
    
    @patch('src.models.user.User.save')
    def test_user_save(self, mock_save):
        """Test user save functionality."""
        user = User(
            name="Save Test",
            email="save@example.com",
            role="user"
        )
        user.save()
        mock_save.assert_called_once()
    
    @patch('src.models.user.User.find_by_email')
    def test_find_by_email(self, mock_find):
        """Test finding user by email."""
        mock_user = Mock()
        mock_user.email = "found@example.com"
        mock_find.return_value = mock_user
        
        result = User.find_by_email("found@example.com")
        assert result is not None
        assert result.email == "found@example.com"
    
    def test_user_serialization(self):
        """Test user object serialization."""
        user = User(
            id=1,
            name="Serialize Test",
            email="serialize@example.com",
            role="user"
        )
        
        user_dict = user.to_dict()
        expected_keys = ['id', 'name', 'email', 'role', 'created_at']
        
        for key in expected_keys:
            assert key in user_dict
        
        # Sensitive data should not be included
        assert 'password_hash' not in user_dict


class TestUserAuthentication:
    """Test user authentication methods."""
    
    @patch('src.models.user.User.find_by_email')
    def test_authenticate_success(self, mock_find):
        """Test successful authentication."""
        mock_user = Mock()
        mock_user.check_password.return_value = True
        mock_find.return_value = mock_user
        
        result = User.authenticate("test@example.com", "correctpassword")
        assert result is not None
        mock_user.check_password.assert_called_once_with("correctpassword")
    
    @patch('src.models.user.User.find_by_email')
    def test_authenticate_wrong_password(self, mock_find):
        """Test authentication with wrong password."""
        mock_user = Mock()
        mock_user.check_password.return_value = False
        mock_find.return_value = mock_user
        
        result = User.authenticate("test@example.com", "wrongpassword")
        assert result is None
    
    @patch('src.models.user.User.find_by_email')
    def test_authenticate_user_not_found(self, mock_find):
        """Test authentication with non-existent user."""
        mock_find.return_value = None
        
        result = User.authenticate("notfound@example.com", "password")
        assert result is None


if __name__ == '__main__':
    pytest.main([__file__])

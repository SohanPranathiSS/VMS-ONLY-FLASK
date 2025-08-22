"""
Basic functionality tests to verify test setup
"""
import pytest

def test_basic_functionality():
    """Test basic Python functionality."""
    assert 1 + 1 == 2

def test_string_operations():
    """Test string operations."""
    test_string = "Visitor Management System"
    assert "Visitor" in test_string
    assert len(test_string) > 0

def test_list_operations():
    """Test list operations."""
    test_list = ["admin", "host", "visitor"]
    assert "admin" in test_list
    assert len(test_list) == 3

class TestBasicMath:
    """Test basic mathematical operations."""
    
    def test_addition(self):
        """Test addition."""
        assert 5 + 3 == 8
    
    def test_multiplication(self):
        """Test multiplication."""
        assert 4 * 3 == 12
    
    def test_division(self):
        """Test division."""
        assert 10 / 2 == 5.0

def test_environment_setup():
    """Test that the test environment is properly set up."""
    import os
    import sys
    
    assert sys.version_info.major >= 3
    assert os.getcwd() is not None

if __name__ == '__main__':
    pytest.main([__file__])

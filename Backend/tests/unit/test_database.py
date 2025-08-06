"""
Comprehensive tests for Database Configuration Module
"""

import pytest
from unittest.mock import patch, MagicMock
import mysql.connector
from config.database import (
    initialize_db_pool, 
    get_db_connection, 
    test_db_connection,
    DB_CONFIG
)

class TestDatabaseConfig:
    """Test database configuration and connection management"""
    
    def test_db_config_structure(self):
        """Test that DB_CONFIG has required keys"""
        required_keys = ['host', 'user', 'password', 'database', 'pool_name', 'pool_size']
        for key in required_keys:
            assert key in DB_CONFIG
    
    def test_db_config_defaults(self):
        """Test default configuration values"""
        assert DB_CONFIG['host'] == 'localhost'
        assert DB_CONFIG['user'] == 'root'
        assert DB_CONFIG['pool_size'] == 10
        assert DB_CONFIG['autocommit'] is True
    
    @patch('config.database.mysql.connector.pooling.MySQLConnectionPool')
    def test_initialize_db_pool_success(self, mock_pool):
        """Test successful database pool initialization"""
        mock_pool.return_value = MagicMock()
        
        result = initialize_db_pool()
        
        assert result is True
        mock_pool.assert_called_once_with(**DB_CONFIG)
    
    @patch('config.database.mysql.connector.pooling.MySQLConnectionPool')
    def test_initialize_db_pool_failure(self, mock_pool):
        """Test database pool initialization failure"""
        mock_pool.side_effect = mysql.connector.Error("Connection failed")
        
        result = initialize_db_pool()
        
        assert result is False
    
    @patch('config.database.connection_pool')
    def test_get_db_connection_success(self, mock_pool):
        """Test successful database connection retrieval"""
        mock_connection = MagicMock()
        mock_pool.get_connection.return_value = mock_connection
        
        result = get_db_connection()
        
        assert result == mock_connection
        mock_pool.get_connection.assert_called_once()
    
    @patch('config.database.connection_pool')
    def test_get_db_connection_failure(self, mock_pool):
        """Test database connection retrieval failure"""
        mock_pool.get_connection.side_effect = mysql.connector.Error("No connections available")
        
        with pytest.raises(mysql.connector.Error):
            get_db_connection()
    
    @patch('config.database.get_db_connection')
    def test_db_connection_test_success(self, mock_get_conn):
        """Test database connection test success"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = (1,)
        mock_get_conn.return_value = mock_conn
        
        result = test_db_connection()
        
        assert result is True
        mock_cursor.execute.assert_called_once_with("SELECT 1")
        mock_cursor.close.assert_called_once()
        mock_conn.close.assert_called_once()
    
    @patch('config.database.get_db_connection')
    def test_db_connection_test_failure(self, mock_get_conn):
        """Test database connection test failure"""
        mock_get_conn.side_effect = Exception("Database error")
        
        result = test_db_connection()
        
        assert result is False

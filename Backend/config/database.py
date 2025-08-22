"""
Database Configuration and Connection Management
Extracted from monolithic app.py for better organization
"""

import mysql.connector
from mysql.connector import pooling
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'vms_db'),
    'pool_name': 'mypool',
    'pool_size': 10,
    'pool_reset_session': True,
    'autocommit': True
}

# Global connection pool
connection_pool = None

def initialize_db_pool():
    """Initialize database connection pool"""
    global connection_pool
    try:
        connection_pool = mysql.connector.pooling.MySQLConnectionPool(**DB_CONFIG)
        logger.info("✅ Database connection pool created successfully")
        return True
    except mysql.connector.Error as err:
        logger.error(f"❌ Database connection failed: {err}")
        return False

def get_db_connection():
    """Get database connection from pool"""
    global connection_pool
    if connection_pool is None:
        if not initialize_db_pool():
            raise Exception("Database connection pool not initialized")
    
    try:
        return connection_pool.get_connection()
    except mysql.connector.Error as err:
        logger.error(f"Error getting database connection: {err}")
        raise

def test_db_connection():
    """Test database connection for health checks"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result is not None
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False

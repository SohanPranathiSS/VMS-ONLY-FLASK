"""
User Model
Handles all user-related database operations
"""

from config.database import get_db_connection
from werkzeug.security import generate_password_hash, check_password_hash
import bcrypt
import logging

logger = logging.getLogger(__name__)

class User:
    def __init__(self):
        pass
    
    @staticmethod
    def create_user(email, password, full_name, role='host', company_id=None):
        """Create a new user"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            hashed_password = generate_password_hash(password)
            
            query = """
            INSERT INTO users (email, password, full_name, role, company_id, is_verified)
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (email, hashed_password, full_name, role, company_id, False))
            user_id = cursor.lastrowid
            
            cursor.close()
            conn.close()
            return user_id
            
        except Exception as e:
            cursor.close()
            conn.close()
            logger.error(f"Error creating user: {str(e)}")
            raise e
    
    @staticmethod
    def get_user_by_email(email):
        """Get user by email"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            query = "SELECT * FROM users WHERE email = %s"
            cursor.execute(query, (email,))
            user = cursor.fetchone()
            
            cursor.close()
            conn.close()
            return user
            
        except Exception as e:
            cursor.close()
            conn.close()
            logger.error(f"Error getting user by email: {str(e)}")
            return None
    
    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            query = "SELECT * FROM users WHERE user_id = %s"
            cursor.execute(query, (user_id,))
            user = cursor.fetchone()
            
            cursor.close()
            conn.close()
            return user
            
        except Exception as e:
            cursor.close()
            conn.close()
            logger.error(f"Error getting user by ID: {str(e)}")
            return None
    
    @staticmethod
    def get_user_by_username(username):
        """Get user by username/email (for login)"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Check both email and username fields
            query = "SELECT * FROM users WHERE email = %s OR username = %s"
            cursor.execute(query, (username, username))
            user = cursor.fetchone()
            
            cursor.close()
            conn.close()
            return user
            
        except Exception as e:
            cursor.close()
            conn.close()
            logger.error(f"Error getting user by username: {str(e)}")
            return None

    @staticmethod
    def authenticate(username, password):
        """Authenticate user login"""
        user = User.get_user_by_username(username)
        if user and User.verify_password(user, password):
            return user
        return None

    @staticmethod
    def verify_user_email(user_id):
        """Mark user email as verified"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            query = "UPDATE users SET is_verified = TRUE WHERE user_id = %s"
            cursor.execute(query, (user_id,))
            
            cursor.close()
            conn.close()
            return True
            
        except Exception as e:
            cursor.close()
            conn.close()
            logger.error(f"Error verifying user email: {str(e)}")
            return False
    
    @staticmethod
    def update_user(user_id, updates):
        """Update user information"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            set_clause = ", ".join([f"{key} = %s" for key in updates.keys()])
            query = f"UPDATE users SET {set_clause} WHERE user_id = %s"
            values = list(updates.values()) + [user_id]
            
            cursor.execute(query, values)
            
            cursor.close()
            conn.close()
            return True
            
        except Exception as e:
            cursor.close()
            conn.close()
            logger.error(f"Error updating user: {str(e)}")
            return False
    
    @staticmethod
    def verify_password(user, password):
        """Verify user password"""
        return check_password_hash(user['password'], password)
    
    @staticmethod
    def get_all_users():
        """Get all users (admin function)"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            query = """
            SELECT user_id, email, full_name, role, company_id, 
                   is_verified, created_at, last_login
            FROM users 
            ORDER BY created_at DESC
            """
            cursor.execute(query)
            users = cursor.fetchall()
            
            cursor.close()
            conn.close()
            return users
            
        except Exception as e:
            cursor.close()
            conn.close()
            logger.error(f"Error getting all users: {str(e)}")
            return []

    @staticmethod
    def delete_user(user_id):
        """Delete user by ID"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            query = "DELETE FROM users WHERE user_id = %s"
            cursor.execute(query, (user_id,))
            conn.commit()
            
            cursor.close()
            conn.close()
            return True
            
        except Exception as e:
            cursor.close()
            conn.close()
            logger.error(f"Error deleting user: {str(e)}")
            return False

    @staticmethod
    def get_user_stats():
        """Get user statistics for admin dashboard"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            query = """
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN is_verified = 1 THEN 1 END) as active_users,
                COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
                COUNT(CASE WHEN role = 'host' THEN 1 END) as hosts,
                COUNT(CASE WHEN role = 'user' THEN 1 END) as users
            FROM users
            """
            cursor.execute(query)
            stats = cursor.fetchone()
            
            cursor.close()
            conn.close()
            return stats if stats else {}
            
        except Exception as e:
            cursor.close()
            conn.close()
            logger.error(f"Error getting user stats: {str(e)}")
            return {}

    @staticmethod
    def update_password(user_id, new_password):
        """Update user password"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
            query = "UPDATE users SET password_hash = %s WHERE user_id = %s"
            cursor.execute(query, (password_hash, user_id))
            conn.commit()
            
            cursor.close()
            conn.close()
            return True
            
        except Exception as e:
            cursor.close()
            conn.close()
            logger.error(f"Error updating password: {str(e)}")
            return False

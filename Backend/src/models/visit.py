"""
Visit Model
Handles all visit-related database operations
"""

from config.database import get_db_connection
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class Visit:
    def __init__(self):
        pass
    
    @staticmethod
    def create_visit(visitor_data):
        """Create a new visit record"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            query = """
            INSERT INTO visits (
                visitor_name, visitor_email, visitor_phone, visitor_company,
                purpose_of_visit, host_name, host_email, host_department,
                visit_date, check_in_time, qr_code, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            values = (
                visitor_data.get('visitor_name'),
                visitor_data.get('visitor_email'),
                visitor_data.get('visitor_phone'),
                visitor_data.get('visitor_company'),
                visitor_data.get('purpose_of_visit'),
                visitor_data.get('host_name'),
                visitor_data.get('host_email'),
                visitor_data.get('host_department'),
                visitor_data.get('visit_date'),
                visitor_data.get('check_in_time'),
                visitor_data.get('qr_code'),
                visitor_data.get('status', 'checked-in')
            )
            
            cursor.execute(query, values)
            visit_id = cursor.lastrowid
            
            cursor.close()
            conn.close()
            return visit_id
            
        except Exception as e:
            cursor.close()
            conn.close()
            logger.error(f"Error creating visit: {str(e)}")
            raise e
    
    @staticmethod
    def get_visit_by_id(visit_id):
        """Get visit by ID"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            query = "SELECT * FROM visits WHERE visit_id = %s"
            cursor.execute(query, (visit_id,))
            visit = cursor.fetchone()
            
            cursor.close()
            conn.close()
            return visit
            
        except Exception as e:
            cursor.close()
            conn.close()
            logger.error(f"Error getting visit by ID: {str(e)}")
            return None
    
    @staticmethod
    def get_all_visits(filters=None):
        """Get all visits with optional filters"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            query = "SELECT * FROM visits"
            params = []
            
            if filters:
                conditions = []
                if filters.get('status'):
                    conditions.append("status = %s")
                    params.append(filters['status'])
                if filters.get('date_from'):
                    conditions.append("visit_date >= %s")
                    params.append(filters['date_from'])
                if filters.get('date_to'):
                    conditions.append("visit_date <= %s")
                    params.append(filters['date_to'])
                if filters.get('host_email'):
                    conditions.append("host_email = %s")
                    params.append(filters['host_email'])
                
                if conditions:
                    query += " WHERE " + " AND ".join(conditions)
            
            query += " ORDER BY visit_date DESC, check_in_time DESC"
            
            cursor.execute(query, params)
            visits = cursor.fetchall()
            
            cursor.close()
            conn.close()
            return visits
            
        except Exception as e:
            cursor.close()
            conn.close()
            logger.error(f"Error getting visits: {str(e)}")
            return []
    
    @staticmethod
    def update_visit_status(visit_id, status, checkout_time=None):
        """Update visit status and checkout time"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            if checkout_time:
                query = "UPDATE visits SET status = %s, check_out_time = %s WHERE visit_id = %s"
                cursor.execute(query, (status, checkout_time, visit_id))
            else:
                query = "UPDATE visits SET status = %s WHERE visit_id = %s"
                cursor.execute(query, (status, visit_id))
            
            cursor.close()
            conn.close()
            return True
            
        except Exception as e:
            cursor.close()
            conn.close()
            logger.error(f"Error updating visit status: {str(e)}")
            return False
    
    @staticmethod
    def get_visit_counts():
        """Get visit counts for dashboard"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            query = """
            SELECT 
                COUNT(*) as total_visits,
                COUNT(CASE WHEN status = 'checked-in' THEN 1 END) as checked_in,
                COUNT(CASE WHEN status = 'checked-out' THEN 1 END) as checked_out,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN DATE(visit_date) = CURDATE() THEN 1 END) as today_visits
            FROM visits
            """
            cursor.execute(query)
            counts = cursor.fetchone()
            
            cursor.close()
            conn.close()
            return counts
            
        except Exception as e:
            cursor.close()
            conn.close()
            logger.error(f"Error getting visit counts: {str(e)}")
            return {}
    
    @staticmethod
    def get_host_visits(host_email):
        """Get visits for a specific host"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            query = """
            SELECT * FROM visits 
            WHERE host_email = %s 
            ORDER BY visit_date DESC, check_in_time DESC
            """
            cursor.execute(query, (host_email,))
            visits = cursor.fetchall()
            
            cursor.close()
            conn.close()
            return visits
            
        except Exception as e:
            cursor.close()
            conn.close()
            logger.error(f"Error getting host visits: {str(e)}")
            return []
    
    @staticmethod
    def check_duplicate_checkin(visitor_email, host_id):
        """Check if visitor is already checked in for the same host company today"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Check for existing check-in for the same visitor email and host company today
            query = """
            SELECT v.*, u.company_name as host_company_name
            FROM visits v
            JOIN visitors vis ON v.visitor_id = vis.id
            JOIN users u ON v.host_id = u.id
            WHERE vis.email = %s 
            AND u.company_name = (SELECT company_name FROM users WHERE id = %s)
            AND DATE(v.visit_date) = CURDATE()
            AND v.status = 'checked-in'
            LIMIT 1
            """
            cursor.execute(query, (visitor_email, host_id))
            existing_visit = cursor.fetchone()
            
            cursor.close()
            conn.close()
            return existing_visit
            
        except Exception as e:
            cursor.close()
            conn.close()
            logger.error(f"Error checking duplicate check-in: {str(e)}")
            return None

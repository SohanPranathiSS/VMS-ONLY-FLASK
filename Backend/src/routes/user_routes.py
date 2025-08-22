from flask import Blueprint, request, jsonify
from config.database import get_db_connection
import logging

# Create a blueprint for user routes
user_routes = Blueprint('users', __name__)

@user_routes.route('/verify-email', methods=['POST'])
def verify_email():
    """
    Verify if a user email exists in the database
    """
    try:
        # Get email from request
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({
                'success': False,
                'message': 'Email is required',
                'exists': False
            }), 400
        
        # Get database connection
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if email exists in users table
        cursor.execute(
            "SELECT * FROM users WHERE email = %s AND is_active = 1",
            (email,)
        )
        
        user = cursor.fetchone()
        
        # Close database connection
        cursor.close()
        conn.close()
        
        if user:
            return jsonify({
                'success': True,
                'message': 'Email exists',
                'exists': True,
                'userId': user['id']
            }), 200
        else:
            return jsonify({
                'success': True,
                'message': 'Email does not exist',
                'exists': False
            }), 200
            
    except Exception as e:
        logging.error(f"Error verifying email: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e),
            'exists': False
        }), 500

@user_routes.route('/register-trial', methods=['POST'])
def register_trial():
    """
    Register a new user for 7-day trial
    """
    try:
        # Get registration data
        data = request.get_json()
        email = data.get('email')
        name = data.get('name')
        company = data.get('company')
        phone = data.get('phone')
        
        if not all([email, name, company]):
            return jsonify({
                'success': False,
                'message': 'Email, name, and company are required'
            }), 400
        
        # Get database connection
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if email already exists
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Email already registered'
            }), 400
        
        # Insert new user with trial subscription
        cursor.execute(
            """
            INSERT INTO users (name, email, phone, company_id, is_active, role)
            VALUES (%s, %s, %s, NULL, 1, 'trial_user')
            """,
            (name, email, phone or '')
        )
        
        # Get the newly inserted user ID
        user_id = cursor.lastrowid
        
        # Create a new company for the user
        cursor.execute(
            """
            INSERT INTO companies (name, created_by, is_active)
            VALUES (%s, %s, 1)
            """,
            (company, user_id)
        )
        
        company_id = cursor.lastrowid
        
        # Update user with company ID
        cursor.execute(
            """
            UPDATE users SET company_id = %s
            WHERE id = %s
            """,
            (company_id, user_id)
        )
        
        # Create a trial subscription
        from datetime import datetime, timedelta
        
        start_date = datetime.now()
        end_date = start_date + timedelta(days=7)
        
        cursor.execute(
            """
            INSERT INTO subscriptions 
            (company_id, plan_name, amount, start_date, end_date, status, payment_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (company_id, 'Trial', 0, start_date, end_date, 'active', 'trial_auto_created')
        )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Trial registration successful',
            'userId': user_id,
            'companyId': company_id
        }), 201
        
    except Exception as e:
        logging.error(f"Error registering trial: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

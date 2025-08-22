from flask import Blueprint, request, jsonify
from config.database import get_db_connection
import logging
from datetime import datetime, timedelta

# Create a blueprint for subscription routes
subscription_routes = Blueprint('subscription', __name__)

@subscription_routes.route('/create', methods=['POST'])
def create_subscription():
    """
    Create a new subscription for a company
    """
    try:
        # Get subscription data from request
        data = request.get_json()
        email = data.get('email')
        plan_name = data.get('planName')
        amount = data.get('amount')
        payment_id = data.get('paymentId')
        
        if not all([email, plan_name, amount, payment_id]):
            return jsonify({
                'success': False,
                'message': 'Email, plan name, amount, and payment ID are required'
            }), 400
        
        # Get database connection
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get the user by email
        cursor.execute(
            "SELECT * FROM users WHERE email = %s AND is_active = 1",
            (email,)
        )
        
        user = cursor.fetchone()
        
        if not user:
            cursor.close()
            conn.close()
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        company_id = user.get('company_id')
        
        if not company_id:
            cursor.close()
            conn.close()
            return jsonify({
                'success': False,
                'message': 'User is not associated with a company'
            }), 400
        
        # Check if company already has an active subscription
        cursor.execute(
            """
            SELECT * FROM subscriptions
            WHERE company_id = %s AND status = 'active'
            """,
            (company_id,)
        )
        
        existing_subscription = cursor.fetchone()
        
        # If there's an existing subscription, mark it as inactive
        if existing_subscription:
            cursor.execute(
                """
                UPDATE subscriptions
                SET status = 'inactive', updated_at = NOW()
                WHERE id = %s
                """,
                (existing_subscription['id'],)
            )
        
        # Create start and end dates (1 month subscription)
        start_date = datetime.now()
        end_date = start_date + timedelta(days=30)
        
        # Create a new subscription
        cursor.execute(
            """
            INSERT INTO subscriptions 
            (company_id, plan_name, amount, start_date, end_date, status, payment_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (company_id, plan_name, amount, start_date, end_date, 'active', payment_id)
        )
        
        subscription_id = cursor.lastrowid
        
        # Update company subscription status and store plan_name
        cursor.execute(
            """
            UPDATE companies
            SET subscription_status = 'active', plan_name = %s, updated_at = NOW()
            WHERE id = %s
            """,
            (plan_name, company_id)
        )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Subscription created successfully',
            'subscriptionId': subscription_id
        }), 201
        
    except Exception as e:
        logging.error(f"Error creating subscription: {str(e)}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

from flask import Blueprint, request, jsonify
import hmac
import hashlib
import json

# Create a blueprint for payment routes
payment_routes = Blueprint('payment', __name__)

# Razorpay credentials
RAZORPAY_KEY_ID = "rzp_test_R7YlLIhpaGugyd"
RAZORPAY_KEY_SECRET = "KStiFQ0QEKX1jvzSaH2fd6jX"

@payment_routes.route('/verify', methods=['POST'])
def verify_payment():
    """
    Verify the Razorpay payment signature
    """
    try:
        # Get payment data from request
        data = request.get_json()
        
        # Required parameters from the client
        payment_id = data.get('razorpay_payment_id')
        order_id = data.get('razorpay_order_id')
        signature = data.get('razorpay_signature')
        plan = data.get('plan')
        
        # Verify the payment signature
        msg = f'{order_id}|{payment_id}'
        generated_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            msg=msg.encode(),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        if generated_signature == signature:
            # Payment verification successful
            # Here you would typically update your database with payment details
            # and update user subscription status
            
            return jsonify({
                'success': True,
                'message': 'Payment verification successful',
                'plan': plan
            }), 200
        else:
            # Payment verification failed
            return jsonify({
                'success': False,
                'message': 'Payment verification failed'
            }), 400
            
    except Exception as e:
        # Handle errors
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@payment_routes.route('/create-order', methods=['POST'])
def create_order():
    """
    Create a new Razorpay order
    In a real implementation, this would use the Razorpay client library
    """
    try:
        # Get order data from request
        data = request.get_json()
        amount = data.get('amount')
        currency = data.get('currency', 'INR')
        receipt = data.get('receipt', 'order_receipt')
        notes = data.get('notes', {})
        
        # In a real implementation, you would use the Razorpay client library to create an order
        # For now, we'll just return a mock response
        
        return jsonify({
            'success': True,
            'order': {
                'id': 'mock_order_id',
                'amount': amount,
                'currency': currency
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

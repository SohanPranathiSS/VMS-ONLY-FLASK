# Flask Backend for Visitor Management System
# Converted from Node.js to Python Flask

from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta, timezone
import mysql.connector
from mysql.connector import pooling
import os
import json
import logging
from functools import wraps
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import base64
import io
import csv
import pandas as pd
# Import openpyxl components
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils.dataframe import dataframe_to_rows
from openpyxl.chart import BarChart, PieChart, LineChart, Reference
import tempfile
import random

# Optional weasyprint import with fallback
try:
    import weasyprint
    WEASYPRINT_AVAILABLE = True
    print("✓ WeasyPrint loaded successfully")
except (ImportError, OSError) as e:
    WEASYPRINT_AVAILABLE = False
    print(f"⚠ WeasyPrint not available: {e}")
    print("  PDF export will use HTML fallback that can be printed as PDF from browser.")
from werkzeug.utils import secure_filename
import uuid
import random
import string
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET', 'your-super-secret-jwt-key-change-this-in-production')
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Enable CORS
CORS(app, origins=["http://localhost:3000"], 
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
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

# Create connection pool
try:
    connection_pool = mysql.connector.pooling.MySQLConnectionPool(**DB_CONFIG)
    logger.info("✅ Database connection pool created successfully")
except mysql.connector.Error as err:
    logger.error(f"❌ Database connection failed: {err}")
    exit(1)

def get_db_connection():
    """Get database connection from pool"""
    try:
        return connection_pool.get_connection()
    except mysql.connector.Error as err:
        logger.error(f"Error getting database connection: {err}")
        raise

# Utility functions
def generate_qr_code():
    """Generate unique QR code"""
    timestamp = str(int(datetime.now().timestamp()))
    random_str = ''.join(random.choices(string.ascii_letters + string.digits, k=9))
    return f"VMS-{timestamp}-{random_str}"

def get_company_id_from_companies_table(user_id):
    """Get company_id from companies table using admin_company_id (user_id)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Look for company where admin_company_id matches the user_id
        cursor.execute("""
            SELECT id as company_id FROM companies 
            WHERE admin_company_id = %s 
            LIMIT 1
        """, (user_id,))
        
        company = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if company:
            return company['company_id']
        else:
            # Fallback: If no company found in companies table, 
            # get company_id from users table for backward compatibility
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT company_id FROM users WHERE id = %s", (user_id,))
            user_data = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if user_data:
                return user_data[0]
            else:
                logger.warning(f"No company found for user_id {user_id}, defaulting to 1")
                return 1
                
    except Exception as e:
        logger.error(f"Error getting company_id from companies table: {e}")
        # Fallback to user's company_id from users table
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT company_id FROM users WHERE id = %s", (user_id,))
            user_data = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if user_data:
                return user_data[0]
            else:
                return 1
        except:
            return 1

def send_email(to_email, subject, html_content):
    """Send email notification using Gmail SMTP"""
    try:
        smtp_server = 'smtp.gmail.com'
        smtp_port = 587
        smtp_user = os.getenv('EMAIL_USER')
        smtp_password = os.getenv('EMAIL_PASS')
        
        if not smtp_user or not smtp_password:
            logger.warning("Email credentials not configured in .env file")
            return False
            
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(html_content, 'html'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Verification email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Email sending failed: {e}")
        return False

# Authentication decorator
def authenticate_token(f):
    """JWT authentication decorator"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'message': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            
            # Get user from database
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM users WHERE id = %s", (data['id'],))
            current_user = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
                
            request.current_user = current_user
            
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is invalid'}), 401
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return jsonify({'message': 'Authentication failed'}), 401
        
        return f(*args, **kwargs)
    
    return decorated

# Handle preflight OPTIONS requests
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify()
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization")
        response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS")
        response.headers.add('Access-Control-Allow-Credentials', "true")
        return response

# Test database connection endpoint
@app.route('/api/test-db', methods=['GET'])
def test_db():
    """Test database connection"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Database connection successful',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Database test failed: {e}")
        return jsonify({
            'success': False,
            'message': 'Database connection failed',
            'error': str(e)
        }), 500

# Database schema check endpoint
@app.route('/api/check-schema', methods=['GET'])
def check_schema():
    """Check database schema for debugging"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check visitors table schema
        cursor.execute("DESCRIBE visitors")
        visitors_schema = cursor.fetchall()
        
        # Check visits table schema
        cursor.execute("DESCRIBE visits")
        visits_schema = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'visitors_table': [
                {
                    'Field': col[0],
                    'Type': col[1],
                    'Null': col[2],
                    'Key': col[3],
                    'Default': col[4],
                    'Extra': col[5]
                } for col in visitors_schema
            ],
            'visits_table': [
                {
                    'Field': col[0],
                    'Type': col[1],
                    'Null': col[2],
                    'Key': col[3],
                    'Default': col[4],
                    'Extra': col[5]
                } for col in visits_schema
            ]
        })
    except Exception as e:
        logger.error(f"Schema check failed: {e}")
        return jsonify({
            'success': False,
            'message': 'Schema check failed',
            'error': str(e)
        }), 500

# Debug endpoint to check visits data
@app.route('/api/debug-visits', methods=['GET'])
def debug_visits():
    """Debug endpoint to check all visits data"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if tables exist
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        # Get all visits with visitor data
        cursor.execute("""
            SELECT v.*, vis.name as visitor_name_from_visitors, h.name as host_name
            FROM visits v
            LEFT JOIN visitors vis ON v.visitor_id = vis.id
            LEFT JOIN users h ON v.host_id = h.id
            ORDER BY v.check_in_time DESC
            LIMIT 10
        """)
        visits = cursor.fetchall()
        
        # Get count of total visits
        cursor.execute("SELECT COUNT(*) as total FROM visits")
        total_visits = cursor.fetchone()
        
        # Get count of total users
        cursor.execute("SELECT COUNT(*) as total FROM users")
        total_users = cursor.fetchone()
        
        # Get count of hosts specifically
        cursor.execute("SELECT COUNT(*) as total FROM users WHERE role = 'host'")
        total_hosts = cursor.fetchone()
        
        # Get all hosts and their visit counts
        cursor.execute("""
            SELECT u.id, u.name, u.email, u.role, 
                   COUNT(v.id) as visit_count
            FROM users u
            LEFT JOIN visits v ON u.id = v.host_id
            WHERE u.role = 'host'
            GROUP BY u.id, u.name, u.email, u.role
            ORDER BY visit_count DESC
        """)
        hosts_with_visits = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'database_tables': [list(table.values())[0] for table in tables],
            'total_visits': total_visits,
            'total_users': total_users,
            'total_hosts': total_hosts,
            'recent_visits': visits,
            'hosts_with_visit_counts': hosts_with_visits
        })
    except Exception as e:
        logger.error(f"Debug visits failed: {e}")
        return jsonify({
            'success': False,
            'message': 'Debug failed',
            'error': str(e)
        }), 500

# ============== AUTHENTICATION ENDPOINTS ==============

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user - handles both company registration and admin creating hosts"""
    try:
        data = request.get_json()
        
        # Debug: log the received data
        logger.info(f"Register endpoint received data: {data}")
        
        # Check if this is an admin creating a host (has firstName/lastName) or regular registration
        if 'firstName' in data:
            # Admin creating a host user
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                return jsonify({'message': 'Authorization required for user creation'}), 401
            
            try:
                token = auth_header.split(' ')[1]
                token_data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
                
                # Get admin user
                conn = get_db_connection()
                cursor = conn.cursor(dictionary=True)
                cursor.execute("SELECT * FROM users WHERE id = %s", (token_data['id'],))
                admin_user = cursor.fetchone()
                
                if not admin_user or admin_user['role'] != 'admin':
                    cursor.close()
                    conn.close()
                    return jsonify({'message': 'Admin access required'}), 403
                
                # Validate required fields for host creation
                required_fields = ['firstName', 'email', 'password']
                for field in required_fields:
                    if not data.get(field) or not str(data.get(field)).strip():
                        return jsonify({'message': f'{field} is required'}), 400
                
                # lastName is optional - if not provided or empty, use empty string
                last_name = data.get('lastName', '').strip()
                
                # Combine first and last name
                if last_name:
                    full_name = f"{data['firstName'].strip()} {last_name}"
                else:
                    full_name = data['firstName'].strip()
                
                email = data['email'].strip()
                password = data['password']
                role = 'host'  # Always create hosts when admin creates users
                company_name = admin_user['company_name']
                
                # Check if user already exists
                cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
                existing_user = cursor.fetchone()
                
                if existing_user:
                    cursor.close()
                    conn.close()
                    return jsonify({'message': 'User already exists with this email'}), 409
                
                # Hash password
                hashed_password = generate_password_hash(password)
                
                # Get company_id from companies table using admin's user_id
                admin_company_id = get_company_id_from_companies_table(admin_user['id'])
                
                # Insert new host user with is_verified = 1 (admin-created hosts are auto-verified)
                cursor.execute("""
                    INSERT INTO users (name, email, password, role, company_name, company_id, is_verified)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (full_name, email, hashed_password, role, company_name, admin_company_id, 1))
                
                user_id = cursor.lastrowid
                cursor.close()
                conn.close()
                
                return jsonify({
                    'message': 'Host user created successfully and is ready to login immediately',
                    'userId': user_id,
                    'name': full_name,
                    'email': email,
                    'role': role,
                    'verified': True
                }), 201
                
            except jwt.ExpiredSignatureError:
                return jsonify({'message': 'Token has expired'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'message': 'Invalid token'}), 401
            except Exception as e:
                logger.error(f"Token validation error: {e}")
                return jsonify({'message': 'Authentication failed'}), 401
        
        else:
            # Regular user registration
            required_fields = ['name', 'email', 'password', 'role', 'company_name']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({'message': f'{field} is required'}), 400
            
            name = data['name']
            email = data['email']
            password = data['password']
            role = data['role']
            company_name = data['company_name']
            
            # Validate role
            if role not in ['admin', 'host']:
                return jsonify({'message': 'Invalid role. Must be admin or host.'}), 400
            
            # Check if user already exists
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            existing_user = cursor.fetchone()
            
            if existing_user:
                cursor.close()
                conn.close()
                return jsonify({'message': 'User already exists with this email'}), 409
            
            # Hash password
            hashed_password = generate_password_hash(password)
            
            # Add mobile_number column to users table if it doesn't exist
            try:
                cursor.execute("ALTER TABLE users ADD COLUMN mobile_number VARCHAR(20) NULL")
                logger.info("Added mobile_number column to users table")
            except Exception as alter_error:
                # Column might already exist, that's fine
                logger.debug(f"ALTER TABLE for mobile_number: {alter_error}")
            
        # Generate a unique company_id based on company_name hash or use auto-increment
        # For now, we'll use a simple approach - get next company_id based on existing companies
        cursor.execute("SELECT MAX(company_id) as max_id FROM users WHERE company_name = %s", (company_name,))
        existing_company = cursor.fetchone()
        
        if existing_company and existing_company[0]:
            # Company already exists, use same company_id
            company_id = existing_company[0]
        else:
            # New company, get next available company_id
            cursor.execute("SELECT MAX(company_id) as max_id FROM users")
            max_result = cursor.fetchone()
            company_id = (max_result[0] if max_result and max_result[0] else 0) + 1
        
        # Insert new user with proper company_id
        cursor.execute("""
            INSERT INTO users (name, email, password, role, company_name, company_id, is_verified, mobile_number)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (name, email, hashed_password, role, company_name, company_id, 0, ''))
        
        user_id = cursor.lastrowid
        cursor.close()
        conn.close()
        
        # Send verification email
        verification_token = jwt.encode({
            'user_id': user_id,
            'exp': datetime.now(timezone.utc) + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        verification_link = f"http://localhost:4000/api/verify-email?token={verification_token}"
        email_subject = "Verify Your Email - Visitor Management System"
        email_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">Welcome to VMS!</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">Visitor Management System</p>
            </div>
            <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Hello {name},</h2>
                <p style="color: #666; line-height: 1.6;">Thank you for registering with our Visitor Management System. To complete your registration and secure your account, please verify your email address by clicking the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_link}" style="display: inline-block; background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Verify My Email</a>
                </div>
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    <strong>Important:</strong> This verification link will expire in 24 hours. You will not be able to log in until your email is verified.
                </p>
                <p style="color: #666; font-size: 14px;">If you didn't create this account, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    Best regards,<br>
                    The VMS Team<br>
                    Visitor Management System
                </p>
            </div>
        </div>
        """
        
        send_email(email, email_subject, email_body)
        
        return jsonify({
            'message': 'User registered successfully. Please check your email to verify your account before logging in.',
            'userId': user_id
        }), 201
        
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({'message': 'Registration failed', 'error': str(e)}), 500

@app.route('/api/registerCompany', methods=['POST'])
def register_company():
    """Register a new company with admin user"""
    try:
        data = request.get_json()
        
        # Validate required fields for company registration (matching frontend field names)
        required_fields = ['companyName', 'firstName', 'lastName', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        company_name = data['companyName']
        admin_first_name = data['firstName']
        admin_last_name = data['lastName']
        admin_email = data['email']
        admin_password = data['password']
        mobile_number = data.get('mobileNumber', '')
        
        # Combine first and last name
        admin_name = f"{admin_first_name} {admin_last_name}"
        
        # Check if company or admin already exists
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if admin email already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (admin_email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            cursor.close()
            conn.close()
            return jsonify({'message': 'Email already exists'}), 409
        
        # Generate a unique company_id for new company
        # Check if company name already exists
        cursor.execute("SELECT company_id FROM users WHERE company_name = %s LIMIT 1", (company_name,))
        existing_company = cursor.fetchone()
        
        if existing_company:
            cursor.close()
            conn.close()
            return jsonify({'message': 'Company name already exists'}), 409
        
        # Hash password
        hashed_password = generate_password_hash(admin_password)
        
        # Add mobile_number column to users table if it doesn't exist
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN mobile_number VARCHAR(20) NULL")
            logger.info("Added mobile_number column to users table")
        except Exception as alter_error:
            # Column might already exist, that's fine
            logger.debug(f"ALTER TABLE for mobile_number: {alter_error}")
        
        # Get next available company_id
        cursor.execute("SELECT MAX(company_id) as max_id FROM users")
        max_result = cursor.fetchone()
        company_id = (max_result[0] if max_result and max_result[0] else 0) + 1
        
        # Insert new admin user with proper company_id
        cursor.execute("""
            INSERT INTO users (name, email, password, role, company_name, company_id, is_verified, mobile_number)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (admin_name, admin_email, hashed_password, 'admin', company_name, company_id, 0, mobile_number))
        
        user_id = cursor.lastrowid
        cursor.close()
        conn.close()
        
        # Send verification email
        verification_token = jwt.encode({
            'user_id': user_id,
            'exp': datetime.now(timezone.utc) + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        verification_link = f"http://localhost:4000/api/verify-email?token={verification_token}"
        email_subject = "Verify Your Email - Visitor Management System"
        email_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">Welcome to VMS!</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">Visitor Management System</p>
            </div>
            <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Hello {admin_name},</h2>
                <p style="color: #666; line-height: 1.6;">Thank you for registering your company <strong>"{company_name}"</strong> with our Visitor Management System. To complete your registration and access your admin dashboard, please verify your email address by clicking the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_link}" style="display: inline-block; background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Verify My Email</a>
                </div>
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    <strong>Important:</strong> This verification link will expire in 24 hours. You will not be able to access your admin dashboard until your email is verified.
                </p>
                <p style="color: #666; font-size: 14px;">If you didn't create this account, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    Best regards,<br>
                    The VMS Team<br>
                    Visitor Management System
                </p>
            </div>
        </div>
        """
        
        send_email(admin_email, email_subject, email_body)
        
        return jsonify({
            'message': 'Company and admin user registered successfully. Please check your email to verify your account before logging in.',
            'userId': user_id,
            'companyName': company_name
        }), 201
        
    except Exception as e:
        logger.error(f"Company registration error: {e}")
        return jsonify({'message': 'Company registration failed', 'error': str(e)}), 500

@app.route('/api/verify-email', methods=['GET'])
def verify_email():
    """Verify user email"""
    try:
        token = request.args.get('token')
        
        if not token:
            return jsonify({'message': 'Verification token is required'}), 400
        
        # Decode token
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = data['user_id']
        
        # Update user as verified
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            # First get user data before updating
            cursor.execute("""
                SELECT id, name, email, password, role, company_name, is_verified, COALESCE(mobile_number, '') as mobile_number
                FROM users WHERE id = %s
            """, (user_id,))
            user_data = cursor.fetchone()
            
            if not user_data:
                cursor.close()
                conn.close()
                return jsonify({'message': 'User not found'}), 404
            
            user_id_db, name, email, password, role, company_name, current_verified, mobile_number = user_data
            
            # Check if user is already verified
            if current_verified == 1:
                cursor.close()
                conn.close()
                return jsonify({'message': 'Email already verified'}), 200
            
            # Update user as verified
            cursor.execute("""
                UPDATE users SET is_verified = 1 WHERE id = %s
            """, (user_id,))
            
            if cursor.rowcount == 0:
                cursor.close()
                conn.close()
                return jsonify({'message': 'Failed to verify user'}), 500
            
            # Insert record into companies table when verification is successful
            # Split name into first and last name
            name_parts = name.split(' ', 1)
            firstname = name_parts[0] if len(name_parts) > 0 else ''
            lastname = name_parts[1] if len(name_parts) > 1 else ''
            
            # Check if companies table exists and create if needed
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS companies (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    firstname VARCHAR(100) NOT NULL,
                    lastname VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL,
                    company_name VARCHAR(200) NOT NULL,
                    admin_company_id INT NOT NULL,
                    mobile_number VARCHAR(20) NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_email (email),
                    INDEX idx_admin_company_id (admin_company_id)
                )
            """)
            
            # Insert into companies table
            cursor.execute("""
                INSERT INTO companies (firstname, lastname, email, password, role, company_name, admin_company_id, mobile_number, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """, (firstname, lastname, email, password, role, company_name, user_id_db, mobile_number))
            
            # Explicitly commit the transaction
            conn.commit()
            
            # Verify the update was successful
            cursor.execute("SELECT is_verified FROM users WHERE id = %s", (user_id,))
            result = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            logger.info(f"User ID {user_id} email verified and record inserted into companies table")
            
            logger.info(f"User ID {user_id} email verified successfully. is_verified = {result[0] if result else 'unknown'}")
            
            # Return a nice HTML page for email verification success
            html_response = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Email Verified - VMS</title>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        margin: 0;
                        padding: 20px;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }}
                    .container {{
                        background: white;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                        text-align: center;
                        max-width: 500px;
                        width: 100%;
                    }}
                    .success-icon {{
                        color: #28a745;
                        font-size: 60px;
                        margin-bottom: 20px;
                    }}
                    h1 {{
                        color: #333;
                        margin-bottom: 20px;
                    }}
                    p {{
                        color: #666;
                        line-height: 1.6;
                        margin-bottom: 30px;
                    }}
                    .login-button {{
                        background-color: #007bff;
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        display: inline-block;
                        transition: background-color 0.3s;
                    }}
                    .login-button:hover {{
                        background-color: #0056b3;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="success-icon">✅</div>
                    <h1>Email Verified Successfully!</h1>
                    <p>Your email address has been verified. You can now log in to your Visitor Management System account.</p>
                    <a href="http://localhost:3000/login" class="login-button">Go to Login</a>
                </div>
            </body>
            </html>
            """
            return html_response, 200
            
        except Exception as db_error:
            conn.rollback()
            cursor.close()
            conn.close()
            logger.error(f"Database error during verification: {db_error}")
            return jsonify({'message': 'Email verification failed'}), 500
        
    except jwt.ExpiredSignatureError:
        html_response = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Verification Link Expired - VMS</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f8f9fa; margin: 0; padding: 20px; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
                .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); text-align: center; max-width: 500px; width: 100%; }
                .error-icon { color: #dc3545; font-size: 60px; margin-bottom: 20px; }
                h1 { color: #333; margin-bottom: 20px; }
                p { color: #666; line-height: 1.6; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="error-icon">⏰</div>
                <h1>Verification Link Expired</h1>
                <p>This verification link has expired. Please request a new verification email from the login page.</p>
            </div>
        </body>
        </html>
        """
        return html_response, 400
    except jwt.InvalidTokenError:
        html_response = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invalid Verification Link - VMS</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f8f9fa; margin: 0; padding: 20px; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
                .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); text-align: center; max-width: 500px; width: 100%; }
                .error-icon { color: #dc3545; font-size: 60px; margin-bottom: 20px; }
                h1 { color: #333; margin-bottom: 20px; }
                p { color: #666; line-height: 1.6; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="error-icon">❌</div>
                <h1>Invalid Verification Link</h1>
                <p>This verification link is invalid. Please check your email for the correct link or request a new verification email.</p>
            </div>
        </body>
        </html>
        """
        return html_response, 400
    except Exception as e:
        logger.error(f"Email verification error: {e}")
        return jsonify({'message': 'Email verification failed'}), 500

@app.route('/api/resend-verification', methods=['POST'])
def resend_verification():
    """Resend verification email to user"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'message': 'Email is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user exists and is not already verified
        cursor.execute("SELECT id, is_verified FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'message': 'Email not found'}), 404
        
        user_id, is_verified = user
        
        if is_verified:
            return jsonify({'message': 'Email is already verified'}), 400
        
        # Generate new verification token
        token = jwt.encode({
            'user_id': user_id,
            'exp': datetime.now(timezone.utc) + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        verification_link = f"{request.url_root.rstrip('/')}/api/verify-email?token={token}"
        
        # Send verification email
        subject = "Verify Your Email - Visitor Management System"
        body = f"""
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    margin: 0;
                    padding: 20px;
                    background-color: #f4f4f4;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }}
                .header {{
                    text-align: center;
                    color: #333;
                    border-bottom: 2px solid #007bff;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }}
                .content {{
                    color: #555;
                    margin-bottom: 30px;
                }}
                .verify-button {{
                    display: block;
                    width: 200px;
                    margin: 20px auto;
                    padding: 12px 24px;
                    background-color: #007bff;
                    color: white;
                    text-decoration: none;
                    text-align: center;
                    border-radius: 5px;
                    font-weight: bold;
                }}
                .footer {{
                    text-align: center;
                    color: #777;
                    font-size: 12px;
                    margin-top: 30px;
                    border-top: 1px solid #eee;
                    padding-top: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Email Verification - Visitor Management System</h2>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>Thank you for registering with our Visitor Management System. Please click the button below to verify your email address:</p>
                    <a href="{verification_link}" class="verify-button">Verify Email Address</a>
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #007bff;">{verification_link}</p>
                    <p><strong>Note:</strong> This verification link will expire in 24 hours for security reasons.</p>
                </div>
                <div class="footer">
                    <p>If you didn't request this verification, please ignore this email.</p>
                    <p>© 2025 Visitor Management System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        if send_email(email, subject, body):
            cursor.close()
            conn.close()
            logger.info(f"Verification email resent to {email}")
            return jsonify({'message': 'Verification email sent successfully'}), 200
        else:
            cursor.close()
            conn.close()
            return jsonify({'message': 'Failed to send verification email'}), 500
            
    except Exception as e:
        logger.error(f"Resend verification error: {e}")
        return jsonify({'message': 'Failed to resend verification email'}), 500

@app.route('/api/manual-verify', methods=['POST'])
def manual_verify():
    """Manually verify a user by user ID (for debugging/admin use)"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'message': 'User ID is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            # Check if user exists and get full user data
            cursor.execute("""
                SELECT id, name, email, password, role, company_name, is_verified, COALESCE(mobile_number, '') as mobile_number
                FROM users WHERE id = %s
            """, (user_id,))
            user = cursor.fetchone()
            
            if not user:
                cursor.close()
                conn.close()
                return jsonify({'message': 'User not found'}), 404
            
            user_id_db, name, email, password, role, company_name, current_verified, mobile_number = user
            
            # Check if user is already verified
            if current_verified == 1:
                cursor.close()
                conn.close()
                return jsonify({'message': 'User is already verified'}), 200
            
            # Update user as verified
            cursor.execute("""
                UPDATE users SET is_verified = 1 WHERE id = %s
            """, (user_id,))
            
            # Insert record into companies table when verification is successful
            # Split name into first and last name
            name_parts = name.split(' ', 1)
            firstname = name_parts[0] if len(name_parts) > 0 else ''
            lastname = name_parts[1] if len(name_parts) > 1 else ''
            
            # Check if companies table exists and create if needed
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS companies (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    firstname VARCHAR(100) NOT NULL,
                    lastname VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL,
                    company_name VARCHAR(200) NOT NULL,
                    admin_company_id INT NOT NULL,
                    mobile_number VARCHAR(20) NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_email (email),
                    INDEX idx_admin_company_id (admin_company_id)
                )
            """)
            
            # Insert into companies table
            cursor.execute("""
                INSERT INTO companies (firstname, lastname, email, password, role, company_name, admin_company_id, mobile_number, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """, (firstname, lastname, email, password, role, company_name, user_id_db, mobile_number))
            
            # Explicitly commit the transaction
            conn.commit()
            
            # Verify the update was successful
            cursor.execute("SELECT is_verified FROM users WHERE id = %s", (user_id,))
            result = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            logger.info(f"Manual verification - User ID {user_id} ({email}) verified and record inserted into companies table")
            return jsonify({
                'message': f'User ID {user_id} manually verified successfully and record added to companies table',
                'email': email,
                'previous_status': current_verified,
                'new_status': result[0] if result else None
            }), 200
            
        except Exception as db_error:
            conn.rollback()
            cursor.close()
            conn.close()
            logger.error(f"Database error during manual verification: {db_error}")
            return jsonify({'message': 'Manual verification failed'}), 500
            
    except Exception as e:
        logger.error(f"Manual verification error: {e}")
        return jsonify({'message': 'Manual verification failed'}), 500

@app.route('/api/debug-unverified', methods=['GET'])
def debug_unverified():
    """Debug endpoint to list all unverified users"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT id, name, email, role, company_name, is_verified
            FROM users 
            WHERE is_verified = 0 
            ORDER BY id DESC
        """)
        unverified_users = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'total_unverified': len(unverified_users),
            'unverified_users': unverified_users
        }), 200
        
    except Exception as e:
        logger.error(f"Debug unverified users error: {e}")
        return jsonify({'message': 'Failed to fetch unverified users'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password are required'}), 400
        
        email = data['email']
        password = data['password']
        
        # Find user
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not user or not check_password_hash(user['password'], password):
            return jsonify({'message': 'Invalid email or password'}), 401
        
        # Check if email is verified
        if not user.get('is_verified', 0):
            return jsonify({
                'message': 'Please verify your email address before logging in. Check your email for the verification link.',
                'emailVerificationRequired': True
            }), 403
        
        # Get company_id from companies table using user_id
        company_id = get_company_id_from_companies_table(user['id'])
        
        # Generate JWT token
        token = jwt.encode({
            'id': user['id'],
            'email': user['email'],
            'role': user['role'],
            'company_name': user['company_name'],
            'company_id': company_id,
            'exp': datetime.now(timezone.utc) + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'token': token,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'role': user['role'],
                'company_name': user['company_name']
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'message': 'Login failed'}), 500

# ============== CONTACT & DEMO ENDPOINTS ==============

@app.route('/api/contact', methods=['POST'])
def contact():
    """Store contact form submission"""
    try:
        data = request.get_json()
        
        required_fields = ['name', 'email', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        name = data['name']
        email = data['email']
        message = data['message']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO contact_us (name, email, message)
            VALUES (%s, %s, %s)
        """, (name, email, message))
        cursor.close()
        conn.close()
        
        # Send notification email to admin
        admin_email = os.getenv('ADMIN_EMAIL')
        if admin_email:
            subject = f"New Contact Form Submission from {name}"
            body = f"""
            <h3>New Contact Form Submission</h3>
            <p><strong>Name:</strong> {name}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Message:</strong></p>
            <p>{message}</p>
            <p><strong>Submitted at:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            """
            send_email(admin_email, subject, body)
        
        return jsonify({'message': 'Contact form submitted successfully'}), 201
        
    except Exception as e:
        logger.error(f"Contact form error: {e}")
        return jsonify({'message': 'Failed to submit contact form'}), 500

@app.route('/api/book-demo', methods=['POST'])
def book_demo():
    """Store demo booking request"""
    try:
        data = request.get_json()
        
        required_fields = ['name', 'email', 'organization']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        name = data['name']
        email = data['email']
        organization = data['organization']
        preferred_date = data.get('preferred_date')
        message = data.get('message', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO book_demo (name, email, organization, preferred_date, message)
            VALUES (%s, %s, %s, %s, %s)
        """, (name, email, organization, preferred_date, message))
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Demo booking request submitted successfully'}), 201
        
    except Exception as e:
        logger.error(f"Demo booking error: {e}")
        return jsonify({'message': 'Failed to submit demo booking'}), 500

# ============== VISITS MANAGEMENT ENDPOINTS ==============

@app.route('/api/visits', methods=['POST'])
@authenticate_token
def create_visit():
    """Create a new visit (Check-In)"""
    try:
        data = request.get_json()
        user = request.current_user
        
        # Debug: log the received data
        logger.info(f"Create visit endpoint received data: {data}")
        
        # Map frontend field names to backend expected names
        visitor_name = data.get('name') or data.get('visitorName')
        visitor_email = data.get('email') or data.get('visitorEmail')
        visitor_phone = data.get('phone') or data.get('visitorPhone', '')
        visitor_designation = data.get('designation') or data.get('visitorDesignation', '')
        visitor_company = data.get('company') or data.get('visitorCompany', '')
        visitor_photo = data.get('photo') or data.get('visitorPhoto', '')
        id_card_photo = data.get('idCardPhoto', '')
        id_card_number = data.get('idCardNumber', '')
        # Extract the missing fields
        company_tel = data.get('companyTel', '')
        website = data.get('website', '')
        address = data.get('address', '')
        id_card_type = data.get('idCardType', '')
        reason = data.get('reason') or data.get('purpose')
        items_carried = data.get('itemsCarried', '')
        pre_registration_id = data.get('pre_registration_id')
        
        # Handle hostId vs hostName
        host_id = data.get('hostId')
        host_name = data.get('hostName')
        
        # If hostName is provided instead of hostId, look up the host ID
        if not host_id and host_name:
            host_conn = get_db_connection()
            host_cursor = host_conn.cursor(dictionary=True, buffered=True)
            try:
                host_cursor.execute("SELECT id FROM users WHERE name = %s", (host_name,))
                host_result = host_cursor.fetchall()
                
                if host_result:
                    host_id = host_result[0]['id']
                else:
                    logger.error(f"Host not found with name: {host_name}")
                    return jsonify({'message': f'Host not found: {host_name}'}), 400
            finally:
                host_cursor.close()
                host_conn.close()
        
        # Required fields validation
        if not visitor_name:
            logger.error(f"Missing visitor name. Available fields: {list(data.keys()) if data else 'No data'}")
            return jsonify({'message': 'Visitor name is required'}), 400
        if not visitor_email:
            logger.error(f"Missing visitor email. Available fields: {list(data.keys()) if data else 'No data'}")
            return jsonify({'message': 'Visitor email is required'}), 400
        if not host_id:
            logger.error(f"Missing host ID/name. Available fields: {list(data.keys()) if data else 'No data'}")
            return jsonify({'message': 'Host is required'}), 400
        if not reason:
            logger.error(f"Missing reason/purpose. Available fields: {list(data.keys()) if data else 'No data'}")
            return jsonify({'message': 'Visit reason is required'}), 400
        
        # Get company_id from companies table using user_id
        company_id = get_company_id_from_companies_table(user['id'])
        
        # Check if visitor is blacklisted using a separate connection
        blacklist_conn = get_db_connection()
        blacklist_cursor = blacklist_conn.cursor(dictionary=True, buffered=True)
        try:
            blacklist_cursor.execute("""
                SELECT id FROM visitors WHERE email = %s AND is_blacklisted = TRUE LIMIT 1
            """, (visitor_email,))
            blacklisted = blacklist_cursor.fetchall()
            
            if blacklisted:
                return jsonify({'message': 'This visitor has been blacklisted and cannot check in.'}), 403
        finally:
            blacklist_cursor.close()
            blacklist_conn.close()
        
        # Perform the main database operations
        main_conn = get_db_connection()
        main_cursor = main_conn.cursor(dictionary=True, buffered=True)
        
        try:
            # Start transaction
            main_conn.start_transaction()
            
            # Always create a new visitor record - including all available fields
            main_cursor.execute("""
                INSERT INTO visitors (name, email, phone, designation, company, photo, idCardPhoto, 
                                    idCardNumber, companyTel, website, address, type_of_card)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (visitor_name, visitor_email, visitor_phone, visitor_designation, 
                  visitor_company, visitor_photo, id_card_photo, id_card_number,
                  company_tel, website, address, id_card_type))
            
            visitor_id = main_cursor.lastrowid
            
            # Create visit record - using only existing columns
            main_cursor.execute("""
                INSERT INTO visits (visitor_id, host_id, reason, itemsCarried, check_in_time, 
                                  status, company_id, pre_registration_id, visitor_name, 
                                  visitor_email, visitor_phone)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (visitor_id, host_id, reason, items_carried, datetime.now(), 
                  'checked_in', company_id, pre_registration_id, visitor_name, 
                  visitor_email, visitor_phone))
            
            visit_id = main_cursor.lastrowid
            
            # Update pre-registration status if applicable
            if pre_registration_id:
                main_cursor.execute("""
                    UPDATE pre_registrations SET status = 'checked_in' 
                    WHERE id = %s
                """, (pre_registration_id,))
            
            main_conn.commit()
            
        except Exception as e:
            main_conn.rollback()
            raise e
        finally:
            main_cursor.close()
            main_conn.close()
        
        # Get host details using a separate connection
        host_details_conn = get_db_connection()
        host_details_cursor = host_details_conn.cursor(dictionary=True)
        try:
            host_details_cursor.execute("SELECT name, email FROM users WHERE id = %s", (host_id,))
            host = host_details_cursor.fetchone()
            host_name_value = host['name'] if host else 'Unknown'
        finally:
            host_details_cursor.close()
            host_details_conn.close()
        
        # Update visit with host name using a separate connection
        update_conn = get_db_connection()
        update_cursor = update_conn.cursor()
        try:
            update_cursor.execute("UPDATE visits SET host_name = %s WHERE id = %s", (host_name_value, visit_id))
            update_conn.commit()
        finally:
            update_cursor.close()
            update_conn.close()
        
        # Send notification email to host
        if host and host['email']:
            subject = f"New Visitor Check-in: {visitor_name}"
            body = f"""
            <h3>New Visitor Check-in Notification</h3>
            <p>Dear {host['name']},</p>
            <p>You have a new visitor:</p>
            <ul>
                <li><strong>Name:</strong> {visitor_name}</li>
                <li><strong>Company:</strong> {visitor_company}</li>
                <li><strong>Purpose:</strong> {reason}</li>
                <li><strong>Check-in Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
            </ul>
            <p>Best regards,<br>Visitor Management System</p>
            """
            send_email(host['email'], subject, body)
        
        return jsonify({
            'message': 'Visitor checked in successfully',
            'visitId': visit_id,
            'visitorId': visitor_id,
            'checkInTime': datetime.now().isoformat(),
            'hostId': host_id,
            'visitorName': visitor_name,
            'visitorEmail': visitor_email
        }), 201
            
    except Exception as e:
        logger.error(f"Visit creation error: {e}")
        return jsonify({'message': 'Failed to create visit'}), 500

@app.route('/api/visits', methods=['GET'])
@authenticate_token
def get_visits():
    """Get all visits with filtering (admin only)"""
    try:
        user = request.current_user
        
        if user['role'] != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        # Get query parameters
        host_id = request.args.get('hostId')
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        host_name = request.args.get('hostName')
        visitor_name = request.args.get('visitorName')
        
        # Build query - include all visitor fields
        query = """
            SELECT v.id, v.reason, v.itemsCarried, v.check_in_time, v.check_out_time,
                   v.visitor_name, v.visitor_email, v.visitor_phone,
                   vis.id AS visitor_id, vis.designation, vis.company AS visitor_company,
                   vis.photo AS visitorPhoto, vis.idCardPhoto, vis.idCardNumber,
                   vis.companyTel, vis.website, vis.address, vis.type_of_card,
                   h.id AS host_id, h.name AS hostName
            FROM visits v
            LEFT JOIN visitors vis ON v.visitor_id = vis.id
            LEFT JOIN users h ON v.host_id = h.id
            WHERE h.company_name = %s
        """
        
        params = [user['company_name']]
        
        # Add filters
        if host_id:
            query += " AND v.host_id = %s"
            params.append(host_id)
        
        if start_date:
            query += " AND DATE(v.check_in_time) >= %s"
            params.append(start_date)
        
        if end_date:
            query += " AND DATE(v.check_in_time) <= %s"
            params.append(end_date)
        
        if host_name:
            query += " AND h.name LIKE %s"
            params.append(f"%{host_name}%")
        
        if visitor_name:
            query += " AND (v.visitor_name LIKE %s OR vis.name LIKE %s)"
            params.append(f"%{visitor_name}%")
            params.append(f"%{visitor_name}%")
        
        query += " ORDER BY v.check_in_time DESC"
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params)
        visits = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify(visits), 200
        
    except Exception as e:
        logger.error(f"Get visits error: {e}")
        return jsonify({'message': 'Failed to fetch visits'}), 500

@app.route('/api/host-visits', methods=['GET'])
@authenticate_token
def get_host_visits():
    """Get visits for the authenticated host"""
    try:
        user = request.current_user
        
        logger.info(f"Host visits request - User: {user['id']}, Role: {user['role']}, Email: {user['email']}")
        
        if user['role'] != 'host':
            logger.warning(f"Non-host user {user['id']} attempted to access host visits")
            return jsonify({'message': 'Host access required'}), 403
        
        host_id = user['id']
        
        # Use LEFT JOIN to ensure we get visits even if visitor record has issues
        # Use the visitor data stored directly in visits table as backup
        query = """
            SELECT v.id, v.reason, v.itemsCarried, v.check_in_time, v.check_out_time, v.status,
                   COALESCE(vis.id, v.visitor_id) AS visitor_id, 
                   COALESCE(vis.name, v.visitor_name) AS visitorName, 
                   COALESCE(vis.email, v.visitor_email) AS visitorEmail, 
                   COALESCE(vis.phone, v.visitor_phone) AS visitorPhone, 
                   COALESCE(vis.designation, '') AS designation, 
                   COALESCE(vis.company, '') AS company, 
                   COALESCE(vis.photo, '') AS visitorPhoto,
                   COALESCE(vis.idCardPhoto, '') AS idCardPhoto, 
                   COALESCE(vis.idCardNumber, '') AS idCardNumber,
                   COALESCE(vis.companyTel, '') AS companyTel,
                   COALESCE(vis.website, '') AS website,
                   COALESCE(vis.address, '') AS address,
                   COALESCE(vis.type_of_card, '') AS type_of_card,
                   h.id AS host_id, h.name AS hostName
            FROM visits v
            LEFT JOIN visitors vis ON v.visitor_id = vis.id
            LEFT JOIN users h ON v.host_id = h.id
            WHERE v.host_id = %s
            ORDER BY v.check_in_time DESC
        """
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, (host_id,))
        visits = cursor.fetchall()
        cursor.close()
        conn.close()
        
        logger.info(f"Host {host_id} visits query returned {len(visits)} results")
        
        # Log a sample of the data for debugging
        if visits:
            logger.info(f"Sample visit data: {visits[0]}")
        else:
            logger.warning(f"No visits found for host {host_id}")
        
        return jsonify(visits), 200
        
    except Exception as e:
        logger.error(f"Get host visits error: {e}")
        return jsonify({'message': 'Failed to fetch host visits'}), 500

@app.route('/api/visits/<int:visit_id>/checkout', methods=['PUT'])
@authenticate_token
def checkout_visitor(visit_id):
    """Check out a visitor"""
    try:
        user = request.current_user
        
        if user['role'] == 'host':
            # Verify this visit belongs to the host
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT host_id FROM visits WHERE id = %s", (visit_id,))
            visit = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if not visit or visit[0] != user['id']:
                return jsonify({'message': 'Visit not found or access denied'}), 404
        
        check_out_time = datetime.now()
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            conn.start_transaction()
            
            # Get visit details first
            cursor.execute("""
                SELECT pre_registration_id FROM visits WHERE id = %s
            """, (visit_id,))
            visit_details = cursor.fetchone()
            
            # Update visit with checkout time
            cursor.execute("""
                UPDATE visits SET check_out_time = %s, status = 'checked_out' 
                WHERE id = %s
            """, (check_out_time, visit_id))
            
            if cursor.rowcount == 0:
                conn.rollback()
                return jsonify({'message': 'Visit not found or already checked out'}), 404
            
            # Update pre-registration if applicable
            if visit_details and visit_details['pre_registration_id']:
                cursor.execute("""
                    UPDATE pre_registrations SET status = 'completed' 
                    WHERE id = %s
                """, (visit_details['pre_registration_id'],))
            
            conn.commit()
            
            return jsonify({
                'message': 'Visitor checked out successfully',
                'checkOutTime': check_out_time.isoformat()
            }), 200
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Checkout error: {e}")
        return jsonify({'message': 'Failed to check out visitor'}), 500

# ============== VISITOR MANAGEMENT ENDPOINTS ==============

@app.route('/api/test-blacklisted', methods=['GET'])
@authenticate_token
def test_blacklisted():
    """Test endpoint to debug blacklisted visitors functionality"""
    try:
        user = request.current_user
        admin_company_name = user['company_name']
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Test data structure
        test_results = {
            'admin_company': admin_company_name,
            'tables_exist': {},
            'columns_exist': {},
            'sample_data': {},
            'table_structures': {}
        }
        
        # Check if tables exist
        cursor.execute("SHOW TABLES LIKE 'visitors'")
        test_results['tables_exist']['visitors'] = cursor.fetchone() is not None
        
        cursor.execute("SHOW TABLES LIKE 'visits'")
        test_results['tables_exist']['visits'] = cursor.fetchone() is not None
        
        cursor.execute("SHOW TABLES LIKE 'users'")
        test_results['tables_exist']['users'] = cursor.fetchone() is not None
        
        # Get visitors table structure
        cursor.execute("SHOW COLUMNS FROM visitors")
        visitors_columns = cursor.fetchall()
        test_results['table_structures']['visitors'] = [col['Field'] for col in visitors_columns]
        
        # Check if is_blacklisted column exists
        cursor.execute("SHOW COLUMNS FROM visitors LIKE 'is_blacklisted'")
        test_results['columns_exist']['is_blacklisted'] = cursor.fetchone() is not None
        
        # Check if reason_for_blacklist column exists
        cursor.execute("SHOW COLUMNS FROM visitors LIKE 'reason_for_blacklist'")
        test_results['columns_exist']['reason_for_blacklist'] = cursor.fetchone() is not None
        
        # Get sample blacklisted visitors
        if test_results['columns_exist']['is_blacklisted']:
            cursor.execute("SELECT COUNT(*) as count FROM visitors WHERE is_blacklisted = TRUE")
            test_results['sample_data']['total_blacklisted'] = cursor.fetchone()['count']
            
            # Get sample of blacklisted visitors with their details
            cursor.execute("""
                SELECT id, name, email, is_blacklisted, reason_for_blacklist
                FROM visitors 
                WHERE is_blacklisted = TRUE 
                LIMIT 5
            """)
            test_results['sample_data']['blacklisted_sample'] = cursor.fetchall()
            
            # Test the simplified query
            cursor.execute("""
                SELECT COUNT(*) as count 
                FROM visitors v
                WHERE v.is_blacklisted = TRUE 
                AND EXISTS (
                    SELECT 1 
                    FROM visits vt 
                    INNER JOIN users hosts ON vt.host_id = hosts.id
                    WHERE (v.id = vt.visitor_id OR v.email = vt.visitor_email)
                    AND hosts.company_name = %s
                )
            """, (admin_company_name,))
            test_results['sample_data']['company_filtered_blacklisted'] = cursor.fetchone()['count']
        
        # Get hosts for this company
        cursor.execute("""
            SELECT id, name, email, company_name 
            FROM users 
            WHERE company_name = %s AND role = 'host'
            LIMIT 5
        """, (admin_company_name,))
        test_results['sample_data']['company_hosts'] = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(test_results), 200
        
    except Exception as e:
        logger.error(f"Test blacklisted error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/visitors/pending', methods=['GET'])
@authenticate_token
def get_pending_visitors():
    """Get all pending visitors (pre-registrations)"""
    try:
        user = request.current_user
        limit = request.args.get('limit', 100)
        
        logger.info(f"Fetching pending visitors for user: {user.get('email', 'unknown')}, role: {user.get('role', 'unknown')}")
        
        # Get company filter based on user role
        if user['role'] == 'admin':
            company_filter = user['company_name']
        else:
            company_filter = user['company_name']
        
        if not company_filter:
            logger.error("No company name found for user")
            return jsonify({'message': 'Company information not found'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Check if pre_registrations table exists
            cursor.execute("SHOW TABLES LIKE 'pre_registrations'")
            table_exists = cursor.fetchone()
            
            if not table_exists:
                logger.warning("pre_registrations table does not exist")
                cursor.close()
                conn.close()
                return jsonify([]), 200
            
            # Check available columns first
            cursor.execute("SHOW COLUMNS FROM pre_registrations")
            columns_info = cursor.fetchall()
            available_columns = [col['Field'] for col in columns_info]
            logger.info(f"Available columns in pre_registrations: {available_columns}")
            
            # Build query with only available columns
            base_columns = ['id', 'visitor_name', 'visitor_email', 'visitor_phone', 
                           'visitor_company', 'host_name', 'visit_date', 'visit_time',
                           'purpose', 'status', 'created_at']
            
            optional_columns = ['qr_code', 'special_requirements', 'number_of_visitors']
            
            # Add available columns
            select_columns = []
            for col in base_columns:
                if col in available_columns:
                    select_columns.append(f'pr.{col}')
            
            for col in optional_columns:
                if col in available_columns:
                    select_columns.append(f'pr.{col}')
            
            if not select_columns:
                logger.error("No valid columns found in pre_registrations table")
                cursor.close()
                conn.close()
                return jsonify({'message': 'Database schema error'}), 500
            
            # Get pending pre-registrations
            query = f"""
                SELECT {', '.join(select_columns)}
                FROM pre_registrations pr
                WHERE pr.company_to_visit = %s 
                AND pr.status IN ('pending', 'approved')
                ORDER BY pr.created_at DESC
                LIMIT %s
            """
            
            logger.info(f"Executing query: {query}")
            cursor.execute(query, (company_filter, int(limit)))
            
            pending_visitors = cursor.fetchall()
            logger.info(f"Found {len(pending_visitors)} pending visitors")
            
            # Process results to handle datetime serialization
            processed_visitors = []
            for visitor in pending_visitors:
                processed_visitor = {}
                for key, value in visitor.items():
                    if isinstance(value, datetime):
                        processed_visitor[key] = value.isoformat()
                    elif hasattr(value, 'total_seconds'):  # timedelta
                        processed_visitor[key] = str(value)
                    elif isinstance(value, (bytes, bytearray)):
                        processed_visitor[key] = value.decode('utf-8') if value else None
                    else:
                        processed_visitor[key] = value
                processed_visitors.append(processed_visitor)
            
            cursor.close()
            conn.close()
            
            return jsonify(processed_visitors), 200
            
        except mysql.connector.Error as db_error:
            logger.error(f"Database error in pending visitors: {db_error}")
            cursor.close()
            conn.close()
            return jsonify({'message': f'Database error: {str(db_error)}'}), 500
        
    except Exception as e:
        logger.error(f"Get pending visitors error: {e}")
        return jsonify({'message': f'Failed to fetch pending visitors: {str(e)}'}), 500

@app.route('/api/visitors/blacklisted', methods=['GET'])
@authenticate_token
def get_blacklisted_visitors():
    """Get all blacklisted visitors who visited hosts from the same company as the admin"""
    try:
        user = request.current_user
        limit = request.args.get('limit', 100)
        admin_company_name = user['company_name']
        
        logger.info(f"Fetching blacklisted visitors for company: {admin_company_name}")
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Check if visitors table exists
            cursor.execute("SHOW TABLES LIKE 'visitors'")
            table_exists = cursor.fetchone()
            
            if not table_exists:
                logger.warning("visitors table does not exist")
                cursor.close()
                conn.close()
                return jsonify([]), 200
            
            # Check if is_blacklisted column exists
            cursor.execute("SHOW COLUMNS FROM visitors LIKE 'is_blacklisted'")
            column_exists = cursor.fetchone()
            
            if not column_exists:
                logger.info("is_blacklisted column doesn't exist, returning empty list")
                cursor.close()
                conn.close()
                return jsonify([]), 200
            
            # Check if reason_for_blacklist column exists
            cursor.execute("SHOW COLUMNS FROM visitors LIKE 'reason_for_blacklist'")
            has_blacklist_reason = cursor.fetchone() is not None
            
            # Query to get blacklisted visitors with comprehensive information
            # Include: Visit Date, Picture, Person Name, Person to Meet, Visitor ID, Visit Reason, Reason to Blacklist, Check-In, Check-Out
            if has_blacklist_reason:
                blacklist_reason_field = "v.reason_for_blacklist as reason_to_blacklist"
            else:
                blacklist_reason_field = "'Not specified' as reason_to_blacklist"
            
            # Simplified query to avoid "Out of sort memory" error
            # Get blacklisted visitors with their latest visit information
            query = f"""
                SELECT 
                    v.id as visitor_id,
                    v.name as person_name,
                    v.email,
                    v.phone,
                    v.company,
                    v.designation,
                    v.photo as picture,
                    v.is_blacklisted,
                    {blacklist_reason_field}
                FROM visitors v
                WHERE v.is_blacklisted = TRUE 
                AND EXISTS (
                    SELECT 1 
                    FROM visits vt 
                    INNER JOIN users hosts ON vt.host_id = hosts.id
                    WHERE (v.id = vt.visitor_id OR v.email = vt.visitor_email)
                    AND hosts.company_name = %s
                )
                ORDER BY v.id DESC
                LIMIT %s
            """
            
            cursor.execute(query, (admin_company_name, int(limit)))
            blacklisted_visitors = cursor.fetchall() or []
            
            # Get visit details for each blacklisted visitor separately
            processed_visitors = []
            for visitor in blacklisted_visitors:
                # Get latest visit details for this visitor
                visit_query = """
                    SELECT 
                        visits.check_in_time,
                        visits.check_out_time,
                        DATE(visits.check_in_time) as visit_date,
                        visits.reason as visit_reason,
                        hosts.name as person_to_meet
                    FROM visits 
                    INNER JOIN users hosts ON visits.host_id = hosts.id
                    WHERE (visits.visitor_id = %s OR visits.visitor_email = %s)
                    AND hosts.company_name = %s
                    ORDER BY visits.check_in_time DESC
                    LIMIT 1
                """
                
                cursor.execute(visit_query, (visitor['visitor_id'], visitor['email'], admin_company_name))
                visit_info = cursor.fetchone() or {}
                
                # Combine visitor and visit information
                processed_visitor = {}
                for key, value in visitor.items():
                    if isinstance(value, datetime):
                        processed_visitor[key] = value.isoformat()
                    elif hasattr(value, 'total_seconds'):  # timedelta
                        processed_visitor[key] = str(value)
                    elif isinstance(value, (bytes, bytearray)):
                        processed_visitor[key] = value.decode('utf-8') if value else None
                    else:
                        processed_visitor[key] = value
                
                # Add visit information
                for key, value in visit_info.items():
                    if isinstance(value, datetime):
                        processed_visitor[key] = value.isoformat()
                    elif hasattr(value, 'total_seconds'):  # timedelta
                        processed_visitor[key] = str(value)
                    elif isinstance(value, (bytes, bytearray)):
                        processed_visitor[key] = value.decode('utf-8') if value else None
                    else:
                        processed_visitor[key] = value
                
                # Add/format specific fields for frontend display
                processed_visitor['visit_date'] = processed_visitor.get('visit_date', '')
                processed_visitor['picture'] = processed_visitor.get('picture', '')
                processed_visitor['person_name'] = processed_visitor.get('person_name', '')
                processed_visitor['person_to_meet'] = processed_visitor.get('person_to_meet', '')
                processed_visitor['visitor_id'] = processed_visitor.get('visitor_id', '')
                processed_visitor['visit_reason'] = processed_visitor.get('visit_reason', '')
                processed_visitor['reason_to_blacklist'] = processed_visitor.get('reason_to_blacklist', 'Not specified')
                processed_visitor['check_in'] = processed_visitor.get('check_in_time', '')
                processed_visitor['check_out'] = processed_visitor.get('check_out_time', '')
                
                # Add blacklist status info
                processed_visitor['blacklist_status'] = 'Active'
                processed_visitor['company_match'] = admin_company_name
                
                # Add created_at and updated_at as current timestamp if not present
                if 'created_at' not in processed_visitor:
                    processed_visitor['created_at'] = datetime.now().isoformat()
                if 'updated_at' not in processed_visitor:
                    processed_visitor['updated_at'] = processed_visitor.get('check_in_time', datetime.now().isoformat())
                
                processed_visitors.append(processed_visitor)
            
            cursor.close()
            conn.close()
            
            logger.info(f"Found {len(processed_visitors)} blacklisted visitors for company {admin_company_name}")
            return jsonify(processed_visitors), 200
            
        except mysql.connector.Error as db_error:
            logger.error(f"Database error in blacklisted visitors: {db_error}")
            cursor.close()
            conn.close()
            return jsonify([]), 200  # Return empty array on DB error
        
    except Exception as e:
        logger.error(f"Get blacklisted visitors error: {e}")
        return jsonify({'message': f'Failed to fetch blacklisted visitors: {str(e)}'}), 500

@app.route('/api/visitors/counts', methods=['GET'])
@authenticate_token
def get_visitor_counts():
    """Get visitor counts for dashboard"""
    try:
        user = request.current_user
        company_filter = user['company_name']
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get pending visitors count
        cursor.execute("""
            SELECT COUNT(*) as count FROM pre_registrations 
            WHERE company_to_visit = %s AND status IN ('pending', 'approved')
        """, (company_filter,))
        pending_count = cursor.fetchone()['count']
        
        # Get blacklisted visitors count (only those who visited hosts from the same company)
        try:
            cursor.execute("SHOW COLUMNS FROM visitors LIKE 'is_blacklisted'")
            column_exists = cursor.fetchone()
            
            if column_exists:
                # Count blacklisted visitors who visited hosts from the same company
                cursor.execute("""
                    SELECT COUNT(DISTINCT v.id) as count 
                    FROM visitors v
                    INNER JOIN visits ON (
                        v.id = visits.visitor_id 
                        OR v.email = visits.visitor_email
                    )
                    INNER JOIN users hosts ON visits.host_id = hosts.id
                    WHERE v.is_blacklisted = TRUE 
                    AND hosts.company_name = %s
                """, (company_filter,))
                blacklisted_count = cursor.fetchone()['count']
            else:
                blacklisted_count = 0
        except Exception as bl_error:
            logger.warning(f"Error checking blacklisted visitors: {bl_error}")
            blacklisted_count = 0
        
        # Get total visitors count (today)
        cursor.execute("""
            SELECT COUNT(*) as count FROM visits v
            JOIN users h ON v.host_id = h.id
            WHERE h.company_name = %s AND DATE(v.check_in_time) = CURDATE()
        """, (company_filter,))
        today_visitors = cursor.fetchone()['count']
        
        # Get total unique visitors
        cursor.execute("""
            SELECT COUNT(DISTINCT v.visitor_email) as count FROM visits v
            JOIN users h ON v.host_id = h.id
            WHERE h.company_name = %s
        """, (company_filter,))
        total_unique_visitors = cursor.fetchone()['count']
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'pending': pending_count,
            'blacklisted': blacklisted_count,
            'todayVisitors': today_visitors,
            'totalUniqueVisitors': total_unique_visitors
        }), 200
        
    except Exception as e:
        logger.error(f"Get visitor counts error: {e}")
        return jsonify({
            'pending': 0,
            'blacklisted': 0,
            'todayVisitors': 0,
            'totalUniqueVisitors': 0
        }), 200

# Add a dedicated endpoint for visitor status metrics that frontend expects
@app.route('/api/visitors/status-counts', methods=['GET'])
@authenticate_token
def get_visitor_status_counts():
    """Get visitor status counts that match frontend expectations"""
    try:
        user = request.current_user
        company_filter = user['company_name']
        
        if not company_filter:
            logger.error("No company name found for user")
            return jsonify({'message': 'Company information not found'}), 400
        
        logger.info(f"Fetching visitor status counts for company: {company_filter}")
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Initialize counts
        counts = {
            'all': 0,
            'checked-in': 0,
            'checked-out': 0,
            'pending': 0,
            'expected': 0,
            'blacklisted': 0
        }
        
        try:
            # Get all visits count
            cursor.execute("""
                SELECT COUNT(*) as count FROM visits v
                JOIN users h ON v.host_id = h.id
                WHERE h.company_name = %s
            """, (company_filter,))
            all_visits = cursor.fetchone()['count'] or 0
            
            # Get checked-in visitors (have check_in_time but no check_out_time)
            cursor.execute("""
                SELECT COUNT(*) as count FROM visits v
                JOIN users h ON v.host_id = h.id
                WHERE h.company_name = %s 
                AND v.check_in_time IS NOT NULL 
                AND v.check_out_time IS NULL
            """, (company_filter,))
            counts['checked-in'] = cursor.fetchone()['count'] or 0
            
            # Get checked-out visitors (have both check_in_time and check_out_time)
            cursor.execute("""
                SELECT COUNT(*) as count FROM visits v
                JOIN users h ON v.host_id = h.id
                WHERE h.company_name = %s 
                AND v.check_in_time IS NOT NULL 
                AND v.check_out_time IS NOT NULL
            """, (company_filter,))
            counts['checked-out'] = cursor.fetchone()['count'] or 0
            
            # Check if pre_registrations table exists
            cursor.execute("SHOW TABLES LIKE 'pre_registrations'")
            pre_reg_exists = cursor.fetchone()
            
            pre_reg_count = 0
            if pre_reg_exists:
                # Get expected visitors (future pre-registrations)
                cursor.execute("""
                    SELECT COUNT(*) as count FROM pre_registrations
                    WHERE company_to_visit = %s 
                    AND status IN ('pending', 'approved', 'confirmed')
                    AND (visit_date >= CURDATE() OR visit_date IS NULL)
                """, (company_filter,))
                counts['expected'] = cursor.fetchone()['count'] or 0
                
                # Get pending visitors (past due pre-registrations)
                cursor.execute("""
                    SELECT COUNT(*) as count FROM pre_registrations
                    WHERE company_to_visit = %s 
                    AND status = 'pending'
                    AND visit_date < CURDATE()
                """, (company_filter,))
                counts['pending'] = cursor.fetchone()['count'] or 0
                
                # Get total pre-registrations
                cursor.execute("""
                    SELECT COUNT(*) as count FROM pre_registrations
                    WHERE company_to_visit = %s
                """, (company_filter,))
                pre_reg_count = cursor.fetchone()['count'] or 0
            
            # Get blacklisted count (only those who visited hosts from the same company)
            cursor.execute("SHOW COLUMNS FROM visitors LIKE 'is_blacklisted'")
            bl_column_exists = cursor.fetchone()
            
            if bl_column_exists:
                cursor.execute("""
                    SELECT COUNT(DISTINCT v.id) as count 
                    FROM visitors v
                    INNER JOIN visits ON (
                        v.id = visits.visitor_id 
                        OR v.email = visits.visitor_email
                    )
                    INNER JOIN users hosts ON visits.host_id = hosts.id
                    WHERE v.is_blacklisted = TRUE 
                    AND hosts.company_name = %s
                """, (company_filter,))
                counts['blacklisted'] = cursor.fetchone()['count'] or 0
            
            # Calculate total
            counts['all'] = all_visits + pre_reg_count
            
            cursor.close()
            conn.close()
            
            logger.info(f"Status counts for {company_filter}: {counts}")
            return jsonify(counts), 200
            
        except mysql.connector.Error as db_error:
            logger.error(f"Database error in status counts: {db_error}")
            cursor.close()
            conn.close()
            return jsonify(counts), 200  # Return zero counts on DB error
        
    except Exception as e:
        logger.error(f"Get visitor status counts error: {e}")
        return jsonify({
            'all': 0,
            'checked-in': 0,
            'checked-out': 0,
            'pending': 0,
            'expected': 0,
            'blacklisted': 0
        }), 200

@app.route('/api/visitors/status-metrics', methods=['GET'])
@authenticate_token
def get_visitor_status_metrics():
    """Get comprehensive visitor status metrics for the dashboard"""
    try:
        user = request.current_user
        company_filter = user['company_name']
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Initialize counts
        counts = {
            'checked-in': 0,
            'checked-out': 0,
            'pending': 0,
            'expected': 0,
            'blacklisted': 0,
            'all': 0
        }
        
        # Get checked-in visitors (have check_in_time but no check_out_time)
        cursor.execute("""
            SELECT COUNT(*) as count FROM visits v
            JOIN users h ON v.host_id = h.id
            WHERE h.company_name = %s 
            AND v.check_in_time IS NOT NULL 
            AND v.check_out_time IS NULL
        """, (company_filter,))
        counts['checked-in'] = cursor.fetchone()['count']
        
        # Get checked-out visitors (have both check_in_time and check_out_time)
        cursor.execute("""
            SELECT COUNT(*) as count FROM visits v
            JOIN users h ON v.host_id = h.id
            WHERE h.company_name = %s 
            AND v.check_in_time IS NOT NULL 
            AND v.check_out_time IS NOT NULL
        """, (company_filter,))
        counts['checked-out'] = cursor.fetchone()['count']
        
        # Get total visits for company (for all count)
        cursor.execute("""
            SELECT COUNT(*) as count FROM visits v
            JOIN users h ON v.host_id = h.id
            WHERE h.company_name = %s
        """, (company_filter,))
        all_visits_count = cursor.fetchone()['count']
        
        # Check if pre_registrations table exists and get pre-registration counts
        cursor.execute("SHOW TABLES LIKE 'pre_registrations'")
        pre_reg_table_exists = cursor.fetchone()
        
        pre_reg_count = 0
        
        if pre_reg_table_exists:
            # Get expected visitors (pre-registrations for today or future with pending/approved status)
            cursor.execute("""
                SELECT COUNT(*) as count FROM pre_registrations
                WHERE company_to_visit = %s 
                AND status IN ('pending', 'approved', 'confirmed')
                AND (visit_date >= CURDATE() OR visit_date IS NULL)
            """, (company_filter,))
            counts['expected'] = cursor.fetchone()['count']
            
            # Get pending visitors (pre-registrations past due with pending status)
            cursor.execute("""
                SELECT COUNT(*) as count FROM pre_registrations
                WHERE company_to_visit = %s 
                AND status = 'pending'
                AND visit_date < CURDATE()
            """, (company_filter,))
            counts['pending'] = cursor.fetchone()['count']
            
            # Get total pre-registrations count
            cursor.execute("""
                SELECT COUNT(*) as count FROM pre_registrations
                WHERE company_to_visit = %s
            """, (company_filter,))
            pre_reg_count = cursor.fetchone()['count']
        
        # Get blacklisted visitors count (only those who visited hosts from the same company)
        try:
            cursor.execute("SHOW COLUMNS FROM visitors LIKE 'is_blacklisted'")
            column_exists = cursor.fetchone()
            
            if column_exists:
                # Get blacklisted visitors who visited hosts from the same company
                cursor.execute("""
                    SELECT COUNT(DISTINCT v.id) as count 
                    FROM visitors v
                    INNER JOIN visits ON (
                        v.id = visits.visitor_id 
                        OR v.email = visits.visitor_email
                    )
                    INNER JOIN users hosts ON visits.host_id = hosts.id
                    WHERE v.is_blacklisted = TRUE 
                    AND hosts.company_name = %s
                """, (company_filter,))
                counts['blacklisted'] = cursor.fetchone()['count'] or 0
            else:
                counts['blacklisted'] = 0
        except Exception as blacklist_error:
            logger.warning(f"Error fetching blacklisted count: {blacklist_error}")
            counts['blacklisted'] = 0
        
        # Calculate total count (visits + pre-registrations)
        counts['all'] = all_visits_count + pre_reg_count
        
        cursor.close()
        conn.close()
        
        logger.info(f"Visitor status metrics for {company_filter}: {counts}")
        
        return jsonify(counts), 200
        
    except Exception as e:
        logger.error(f"Get visitor status metrics error: {e}")
        return jsonify({
            'checked-in': 0,
            'checked-out': 0,
            'pending': 0,
            'expected': 0,
            'blacklisted': 0,
            'all': 0
        }), 200

@app.route('/api/visitors', methods=['GET'])
@authenticate_token
def get_all_visitors():
    """Get all visitors for the company"""
    try:
        user = request.current_user
        limit = request.args.get('limit', 100)
        company_filter = user['company_name']
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get all visitors through visits
        cursor.execute("""
            SELECT DISTINCT v.visitor_name as name, v.visitor_email as email, 
                   v.visitor_phone as phone, vis.company, vis.designation,
                   vis.is_blacklisted, v.check_in_time as last_visit,
                   vis.id as visitor_id
            FROM visits v
            LEFT JOIN visitors vis ON v.visitor_id = vis.id
            JOIN users h ON v.host_id = h.id
            WHERE h.company_name = %s
            ORDER BY v.check_in_time DESC
            LIMIT %s
        """, (company_filter, int(limit)))
        
        all_visitors = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify(all_visitors), 200
        
    except Exception as e:
        logger.error(f"Get all visitors error: {e}")
        return jsonify({'message': 'Failed to fetch visitors'}), 500

@app.route('/api/visitors/<int:visitor_id>/blacklist', methods=['PUT'])
@authenticate_token
def blacklist_visitor(visitor_id):
    """Blacklist or unblacklist a visitor"""
    try:
        user = request.current_user
        
        if user['role'] != 'admin':
            return jsonify({'message': 'Admin access required to blacklist visitors'}), 403
        
        data = request.get_json()
        is_blacklisted = data.get('isBlacklisted', False)
        reason_for_blacklist = data.get('reasonForBlacklist', '') if is_blacklisted else None
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # First check if visitor exists and get their email
        cursor.execute("SELECT id, name, email FROM visitors WHERE id = %s", (visitor_id,))
        visitor = cursor.fetchone()
        
        if not visitor:
            cursor.close()
            conn.close()
            return jsonify({'message': 'Visitor not found'}), 404
        
        visitor_email = visitor['email']
        
        if not visitor_email:
            cursor.close()
            conn.close()
            return jsonify({'message': 'Visitor email not found'}), 400
        
        # Check if reason_for_blacklist column exists
        cursor.execute("SHOW COLUMNS FROM visitors LIKE 'reason_for_blacklist'")
        has_reason_column = cursor.fetchone() is not None
        
        # Update blacklist status for ALL visitors with this email
        if has_reason_column:
            cursor.execute("""
                UPDATE visitors SET is_blacklisted = %s, reason_for_blacklist = %s WHERE email = %s
            """, (is_blacklisted, reason_for_blacklist, visitor_email))
        else:
            cursor.execute("""
                UPDATE visitors SET is_blacklisted = %s WHERE email = %s
            """, (is_blacklisted, visitor_email))
        
        affected_rows = cursor.rowcount
        cursor.close()
        conn.close()
        
        if affected_rows == 0:
            return jsonify({'message': 'No visitors updated'}), 404
        
        action = 'blacklisted' if is_blacklisted else 'unblacklisted'
        logger.info(f"Admin {user['id']} {action} all visitors with email {visitor_email} ({affected_rows} records affected)")
        
        response_data = {
            'message': f'All visitors with email {visitor_email} {action} successfully. {affected_rows} records updated.',
            'visitorId': visitor_id,
            'visitorName': visitor['name'],
            'visitorEmail': visitor_email,
            'isBlacklisted': is_blacklisted,
            'affectedRecords': affected_rows
        }
        
        if is_blacklisted and reason_for_blacklist:
            response_data['reasonForBlacklist'] = reason_for_blacklist
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Blacklist update error: {e}")
        return jsonify({'message': 'Failed to update visitor blacklist status'}), 500

# ============== USER MANAGEMENT ENDPOINTS ==============

@app.route('/api/users', methods=['GET'])
@authenticate_token
def get_users():
    """Get all users from admin's company"""
    try:
        user = request.current_user
        
        if user['role'] != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        admin_company_name = user['company_name']
        
        if not admin_company_name:
            return jsonify({'message': 'Admin company information not found'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT u.id, u.name, u.email, u.role, u.company_name 
            FROM users u
            WHERE u.company_name = %s
            ORDER BY u.role, u.name
        """, (admin_company_name,))
        
        users = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify(users), 200
        
    except Exception as e:
        logger.error(f"Fetch users error: {e}")
        return jsonify({'message': 'Failed to fetch users'}), 500

@app.route('/api/hosts', methods=['GET'])
@authenticate_token
def get_hosts():
    """Get all hosts from the current user's company"""
    try:
        user = request.current_user
        company_name = user['company_name']
        
        if not company_name:
            return jsonify({'message': 'Company information not found'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, name, email FROM users 
            WHERE company_name = %s AND role = 'host'
            ORDER BY name
        """, (company_name,))
        
        hosts = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify(hosts), 200
        
    except Exception as e:
        logger.error(f"Fetch hosts error: {e}")
        return jsonify({'message': 'Failed to fetch hosts'}), 500

# ============== CONTACT & DEMO MANAGEMENT ENDPOINTS ==============

@app.route('/api/contact-messages', methods=['GET'])
@authenticate_token
def get_contact_messages():
    """Get all contact form submissions (admin only)"""
    try:
        user = request.current_user
        
        if user['role'] != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, name, email, message, created_at 
            FROM contact_us 
            ORDER BY created_at DESC
        """)
        
        messages = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify(messages), 200
        
    except Exception as e:
        logger.error(f"Error fetching contact messages: {e}")
        return jsonify({'message': 'Server error while fetching contact messages'}), 500

@app.route('/api/demo-bookings', methods=['GET'])
@authenticate_token
def get_demo_bookings():
    """Get all demo booking requests (admin only)"""
    try:
        user = request.current_user
        
        if user['role'] != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, name, email, organization, preferred_date, message, created_at 
            FROM book_demo 
            ORDER BY created_at DESC
        """)
        
        bookings = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify(bookings), 200
        
    except Exception as e:
        logger.error(f"Error fetching demo bookings: {e}")
        return jsonify({'message': 'Server error while fetching demo bookings'}), 500

# ============== REPORTING & ANALYTICS ENDPOINTS ==============

@app.route('/api/reports', methods=['GET'])
@authenticate_token
def get_reports():
    """Get comprehensive reports data for the admin's company"""
    try:
        user = request.current_user
        
        if user['role'] != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        admin_company_name = user['company_name']
        
        if not admin_company_name:
            return jsonify({'message': 'Admin company information not found'}), 400
        
        # Prepare query parameters
        query_params = [admin_company_name]
        date_filter_clause = ''
        
        if start_date and end_date:
            date_filter_clause = 'AND DATE(v.check_in_time) BETWEEN %s AND %s'
            query_params.extend([start_date, end_date])
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Overview Stats
        overview_query = f"""
            SELECT
                COUNT(v.id) AS totalVisits,
                COUNT(DISTINCT vis.email) AS uniqueVisitors,
                AVG(TIMESTAMPDIFF(MINUTE, v.check_in_time, v.check_out_time)) AS avgDuration
            FROM visits v
            JOIN users h ON v.host_id = h.id
            LEFT JOIN visitors vis ON v.visitor_id = vis.id
            WHERE h.company_name = %s {date_filter_clause}
        """
        
        cursor.execute(overview_query, query_params)
        overview_result = cursor.fetchone()
        
        # Daily Stats
        daily_query = f"""
            SELECT
                DATE(v.check_in_time) as date,
                COUNT(v.id) as visits
            FROM visits v
            JOIN users h ON v.host_id = h.id
            WHERE h.company_name = %s {date_filter_clause}
            GROUP BY DATE(v.check_in_time)
            ORDER BY date ASC
        """
        
        cursor.execute(daily_query, query_params)
        daily_result = cursor.fetchall()
        
        # Host Performance
        host_query = f"""
            SELECT
                h.name as host_name,
                COUNT(v.id) as visits
            FROM visits v
            JOIN users h ON v.host_id = h.id
            WHERE h.company_name = %s {date_filter_clause}
            GROUP BY h.name
            ORDER BY visits DESC
        """
        
        cursor.execute(host_query, query_params)
        host_result = cursor.fetchall()
        
        # Visit Purposes
        purpose_query = f"""
            SELECT
                COALESCE(v.reason, 'Not Specified') as purpose,
                COUNT(v.id) as count
            FROM visits v
            JOIN users h ON v.host_id = h.id
            WHERE h.company_name = %s {date_filter_clause}
            GROUP BY COALESCE(v.reason, 'Not Specified')
            ORDER BY count DESC
        """
        
        cursor.execute(purpose_query, query_params)
        purpose_result = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'overview': overview_result or {'totalVisits': 0, 'uniqueVisitors': 0, 'avgDuration': 0},
            'dailyStats': daily_result or [],
            'hostStats': host_result or [],
            'purposeStats': purpose_result or []
        }), 200
        
    except Exception as e:
        logger.error(f"Reports error: {e}")
        return jsonify({'message': 'Failed to generate reports'}), 500

@app.route('/api/reports/export', methods=['GET'])
@authenticate_token
def export_reports():
    """Export comprehensive report data for the admin's company"""
    try:
        user = request.current_user
        
        if user['role'] != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        format_type = request.args.get('format', 'html')  # 'pdf', 'excel', 'html'
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        # Get comprehensive report data
        report_data = get_comprehensive_report_data(user, start_date, end_date)
        
        if format_type == 'pdf':
            return export_pdf_report(report_data, start_date, end_date, user)
        elif format_type == 'excel':
            return export_excel_report(report_data, start_date, end_date, user)
        else:
            # Generate HTML export
            html_content = generate_html_report_content(report_data, start_date, end_date)
            return jsonify({
                'success': True,
                'data': html_content,
                'filename': f'visitor-report-{datetime.now().strftime("%Y%m%d")}.html'
            }), 200
        
    except Exception as e:
        logger.error(f"Export error: {e}")
        return jsonify({'message': 'Failed to export data'}), 500

def get_comprehensive_report_data(user, start_date, end_date):
    """Get comprehensive visitor data for reports"""
    try:
        admin_company_name = user['company_name']
        
        # Prepare query parameters
        query_params = [admin_company_name]
        date_filter_clause = ''
        
        if start_date and end_date:
            date_filter_clause = 'AND DATE(v.check_in_time) BETWEEN %s AND %s'
            query_params.extend([start_date, end_date])
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 1. Overview Stats
        overview_query = f"""
            SELECT
                COUNT(v.id) AS total_visits,
                COUNT(DISTINCT COALESCE(vis.email, v.visitor_email)) AS unique_visitors,
                COUNT(CASE WHEN v.status = 'checked_in' THEN 1 END) AS active_visits,
                COUNT(CASE WHEN v.status = 'checked_out' THEN 1 END) AS completed_visits,
                AVG(CASE 
                    WHEN v.check_out_time IS NOT NULL 
                    THEN TIMESTAMPDIFF(MINUTE, v.check_in_time, v.check_out_time) 
                END) AS avg_duration_minutes
            FROM visits v
            JOIN users h ON v.host_id = h.id
            LEFT JOIN visitors vis ON v.visitor_id = vis.id
            WHERE h.company_name = %s {date_filter_clause}
        """
        cursor.execute(overview_query, query_params)
        overview = cursor.fetchone()
        
        # 2. Recent Visitor Activity (Last 50 visits)
        recent_query = f"""
            SELECT
                COALESCE(vis.name, v.visitor_name) as visitor_name,
                COALESCE(vis.email, v.visitor_email) as visitor_email,
                COALESCE(vis.company, v.visitor_company) as visitor_company,
                h.name as host_name,
                v.check_in_time,
                v.check_out_time,
                v.reason as purpose,
                v.status,
                CASE 
                    WHEN v.check_out_time IS NOT NULL 
                    THEN TIMESTAMPDIFF(MINUTE, v.check_in_time, v.check_out_time) 
                    ELSE NULL
                END as duration_minutes
            FROM visits v
            JOIN users h ON v.host_id = h.id
            LEFT JOIN visitors vis ON v.visitor_id = vis.id
            WHERE h.company_name = %s {date_filter_clause}
            ORDER BY v.check_in_time DESC
            LIMIT 50
        """
        cursor.execute(recent_query, query_params)
        recent_activity = cursor.fetchall()
        
        # 3. Visit Purpose Analysis
        purpose_query = f"""
            SELECT
                COALESCE(NULLIF(v.reason, ''), 'Not Specified') as purpose,
                COUNT(v.id) as visit_count,
                COUNT(DISTINCT COALESCE(vis.email, v.visitor_email)) as unique_visitors,
                ROUND(AVG(CASE 
                    WHEN v.check_out_time IS NOT NULL 
                    THEN TIMESTAMPDIFF(MINUTE, v.check_in_time, v.check_out_time) 
                END), 2) as avg_duration
            FROM visits v
            JOIN users h ON v.host_id = h.id
            LEFT JOIN visitors vis ON v.visitor_id = vis.id
            WHERE h.company_name = %s {date_filter_clause}
            GROUP BY COALESCE(NULLIF(v.reason, ''), 'Not Specified')
            ORDER BY visit_count DESC
        """
        cursor.execute(purpose_query, query_params)
        purpose_analysis = cursor.fetchall()
        
        # 4. Time-based Analysis (Daily)
        daily_query = f"""
            SELECT
                DATE(v.check_in_time) as visit_date,
                COUNT(v.id) as daily_visits,
                COUNT(DISTINCT COALESCE(vis.email, v.visitor_email)) as unique_daily_visitors,
                COUNT(CASE WHEN HOUR(v.check_in_time) BETWEEN 9 AND 12 THEN 1 END) as morning_visits,
                COUNT(CASE WHEN HOUR(v.check_in_time) BETWEEN 13 AND 17 THEN 1 END) as afternoon_visits,
                COUNT(CASE WHEN HOUR(v.check_in_time) BETWEEN 18 AND 21 THEN 1 END) as evening_visits
            FROM visits v
            JOIN users h ON v.host_id = h.id
            LEFT JOIN visitors vis ON v.visitor_id = vis.id
            WHERE h.company_name = %s {date_filter_clause}
            GROUP BY DATE(v.check_in_time)
            ORDER BY visit_date DESC
            LIMIT 30
        """
        cursor.execute(daily_query, query_params)
        daily_analysis = cursor.fetchall()
        
        # 5. Hourly Pattern Analysis
        hourly_query = f"""
            SELECT
                HOUR(v.check_in_time) as hour_of_day,
                COUNT(v.id) as visit_count,
                CASE 
                    WHEN HOUR(v.check_in_time) BETWEEN 6 AND 11 THEN 'Morning'
                    WHEN HOUR(v.check_in_time) BETWEEN 12 AND 17 THEN 'Afternoon'
                    WHEN HOUR(v.check_in_time) BETWEEN 18 AND 21 THEN 'Evening'
                    ELSE 'Night'
                END as time_period
            FROM visits v
            JOIN users h ON v.host_id = h.id
            WHERE h.company_name = %s {date_filter_clause}
            GROUP BY HOUR(v.check_in_time)
            ORDER BY hour_of_day
        """
        cursor.execute(hourly_query, query_params)
        hourly_analysis = cursor.fetchall()
        
        # 6. Host Performance Analysis
        host_query = f"""
            SELECT
                h.name as host_name,
                h.email as host_email,
                COUNT(v.id) as total_visits,
                COUNT(DISTINCT COALESCE(vis.email, v.visitor_email)) as unique_visitors,
                ROUND(AVG(CASE 
                    WHEN v.check_out_time IS NOT NULL 
                    THEN TIMESTAMPDIFF(MINUTE, v.check_in_time, v.check_out_time) 
                END), 2) as avg_visit_duration
            FROM visits v
            JOIN users h ON v.host_id = h.id
            LEFT JOIN visitors vis ON v.visitor_id = vis.id
            WHERE h.company_name = %s {date_filter_clause}
            GROUP BY h.id, h.name, h.email
            ORDER BY total_visits DESC
        """
        cursor.execute(host_query, query_params)
        host_performance = cursor.fetchall()
        
        # 7. Visitor Company Analysis
        company_query = f"""
            SELECT
                COALESCE(NULLIF(COALESCE(vis.company, v.visitor_company), ''), 'Not Specified') as company,
                COUNT(v.id) as visit_count,
                COUNT(DISTINCT COALESCE(vis.email, v.visitor_email)) as unique_visitors
            FROM visits v
            JOIN users h ON v.host_id = h.id
            LEFT JOIN visitors vis ON v.visitor_id = vis.id
            WHERE h.company_name = %s {date_filter_clause}
            GROUP BY COALESCE(NULLIF(COALESCE(vis.company, v.visitor_company), ''), 'Not Specified')
            ORDER BY visit_count DESC
            LIMIT 20
        """
        cursor.execute(company_query, query_params)
        company_analysis = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {
            'overview': overview,
            'recent_activity': recent_activity,
            'purpose_analysis': purpose_analysis,
            'daily_analysis': daily_analysis,
            'hourly_analysis': hourly_analysis,
            'host_performance': host_performance,
            'company_analysis': company_analysis,
            'report_period': {
                'start_date': start_date,
                'end_date': end_date,
                'generated_at': datetime.now()
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting comprehensive report data: {e}")
        raise e

def export_pdf_report(report_data, start_date, end_date, user):
    """Generate and return PDF report or HTML fallback"""
    try:
        html_content = generate_comprehensive_html_report(report_data, start_date, end_date, user)
        
        if WEASYPRINT_AVAILABLE:
            # Create temporary file for PDF
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                # Generate PDF from HTML
                weasyprint.HTML(string=html_content).write_pdf(tmp_file.name)
                
                # Read the PDF content
                with open(tmp_file.name, 'rb') as pdf_file:
                    pdf_data = pdf_file.read()
                
                # Clean up temporary file
                os.unlink(tmp_file.name)
                
                # Create response
                response = Response(
                    pdf_data,
                    mimetype='application/pdf',
                    headers={
                        'Content-Disposition': f'attachment; filename=visitor-report-{datetime.now().strftime("%Y%m%d")}.pdf',
                        'Content-Type': 'application/pdf'
                    }
                )
                return response
        else:
            # Fallback: Return enhanced HTML that can be printed as PDF by browser
            enhanced_html = add_print_styles_to_html(html_content)
            response = Response(
                enhanced_html,
                mimetype='text/html',
                headers={
                    'Content-Disposition': f'attachment; filename=visitor-report-{datetime.now().strftime("%Y%m%d")}.html',
                    'Content-Type': 'text/html'
                }
            )
            return response
            
    except Exception as e:
        logger.error(f"PDF export error: {e}")
        return jsonify({
            'message': 'Failed to generate PDF report. You can use the HTML export and print it as PDF from your browser.',
            'error': str(e),
            'fallback': True
        }), 500

def add_print_styles_to_html(html_content):
    """Add print-optimized styles to HTML for browser PDF printing"""
    # Add additional CSS for better PDF printing
    print_styles = """
    <style>
        @media print {
            body { 
                margin: 0; 
                background: white !important; 
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            .container { 
                box-shadow: none !important; 
                padding: 15px !important; 
                margin: 0 !important;
            }
            .page-break { 
                page-break-before: always !important; 
            }
            .no-print { 
                display: none !important; 
            }
            table { 
                page-break-inside: avoid; 
            }
            tr { 
                page-break-inside: avoid; 
                page-break-after: auto; 
            }
            .section {
                break-inside: avoid;
            }
        }
        .print-instructions {
            background: #e3f2fd;
            border: 1px solid #2196f3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            text-align: center;
        }
        .print-instructions h3 {
            color: #1976d2;
            margin: 0 0 10px 0;
        }
        @media print {
            .print-instructions {
                display: none !important;
            }
        }
    </style>
    """
    
    # Add print instructions
    print_instructions = """
    <div class="print-instructions no-print">
        <h3>📄 PDF Export Instructions</h3>
        <p><strong>To save this report as PDF:</strong></p>
        <ol style="text-align: left; display: inline-block;">
            <li>Press <kbd>Ctrl+P</kbd> (Windows) or <kbd>Cmd+P</kbd> (Mac)</li>
            <li>Select "Save as PDF" as the destination</li>
            <li>Choose "More settings" and enable "Background graphics"</li>
            <li>Click "Save" to download your PDF report</li>
        </ol>
    </div>
    """
    
    # Insert the styles after the existing <style> tag
    style_end = html_content.find('</style>')
    if style_end != -1:
        html_content = html_content[:style_end] + print_styles + html_content[style_end:]
    
    # Insert instructions after the header
    header_end = html_content.find('</div>', html_content.find('class="meta-info"'))
    if header_end != -1:
        insertion_point = header_end + 6  # After </div>
        html_content = html_content[:insertion_point] + print_instructions + html_content[insertion_point:]
    
    return html_content

def export_excel_report(report_data, start_date, end_date, user):
    """Generate and return Excel report with multiple sheets"""
    try:
        # Create workbook
        wb = Workbook()
        
        # Remove default sheet
        wb.remove(wb.active)
        
        # Define styles
        header_font = Font(bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
        title_font = Font(bold=True, size=14)
        border = Border(
            left=Side(style='thin'),
            right=Side(style='thin'),
            top=Side(style='thin'),
            bottom=Side(style='thin')
        )
        
        # 1. Overview Sheet
        overview_ws = wb.create_sheet("Overview")
        overview_data = [
            ["Visitor Management System Report"],
            [""],
            ["Company", user['company_name']],
            ["Report Period", f"{start_date or 'All time'} to {end_date or 'Present'}"],
            ["Generated", datetime.now().strftime('%Y-%m-%d %H:%M:%S')],
            [""],
            ["Metric", "Value"],
            ["Total Visits", report_data['overview']['total_visits'] or 0],
            ["Unique Visitors", report_data['overview']['unique_visitors'] or 0],
            ["Active Visits", report_data['overview']['active_visits'] or 0],
            ["Completed Visits", report_data['overview']['completed_visits'] or 0],
            ["Average Duration (minutes)", round(report_data['overview']['avg_duration_minutes'] or 0, 2)]
        ]
        
        for row_idx, row_data in enumerate(overview_data, 1):
            for col_idx, value in enumerate(row_data, 1):
                cell = overview_ws.cell(row=row_idx, column=col_idx, value=value)
                if row_idx == 1:
                    cell.font = title_font
                elif row_idx == 7:
                    cell.font = header_font
                    cell.fill = header_fill
        
        # 2. Recent Activity Sheet
        activity_ws = wb.create_sheet("Recent Activity")
        activity_headers = ["Visitor Name", "Email", "Company", "Host", "Check In", "Check Out", "Purpose", "Status", "Duration (min)"]
        
        # Add headers
        for col_idx, header in enumerate(activity_headers, 1):
            cell = activity_ws.cell(row=1, column=col_idx, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.border = border
        
        # Add data
        for row_idx, activity in enumerate(report_data['recent_activity'], 2):
            activity_ws.cell(row=row_idx, column=1, value=activity.get('visitor_name', ''))
            activity_ws.cell(row=row_idx, column=2, value=activity.get('visitor_email', ''))
            activity_ws.cell(row=row_idx, column=3, value=activity.get('visitor_company', ''))
            activity_ws.cell(row=row_idx, column=4, value=activity.get('host_name', ''))
            activity_ws.cell(row=row_idx, column=5, value=activity.get('check_in_time', ''))
            activity_ws.cell(row=row_idx, column=6, value=activity.get('check_out_time', ''))
            activity_ws.cell(row=row_idx, column=7, value=activity.get('purpose', ''))
            activity_ws.cell(row=row_idx, column=8, value=activity.get('status', ''))
            activity_ws.cell(row=row_idx, column=9, value=activity.get('duration_minutes', ''))
        
        # 3. Purpose Analysis Sheet
        purpose_ws = wb.create_sheet("Purpose Analysis")
        purpose_headers = ["Purpose", "Visit Count", "Unique Visitors", "Avg Duration (min)"]
        
        for col_idx, header in enumerate(purpose_headers, 1):
            cell = purpose_ws.cell(row=1, column=col_idx, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.border = border
        
        for row_idx, purpose in enumerate(report_data['purpose_analysis'], 2):
            purpose_ws.cell(row=row_idx, column=1, value=purpose.get('purpose', ''))
            purpose_ws.cell(row=row_idx, column=2, value=purpose.get('visit_count', 0))
            purpose_ws.cell(row=row_idx, column=3, value=purpose.get('unique_visitors', 0))
            purpose_ws.cell(row=row_idx, column=4, value=purpose.get('avg_duration', 0))
        
        # 4. Daily Analysis Sheet
        daily_ws = wb.create_sheet("Daily Analysis")
        daily_headers = ["Date", "Total Visits", "Unique Visitors", "Morning", "Afternoon", "Evening"]
        
        for col_idx, header in enumerate(daily_headers, 1):
            cell = daily_ws.cell(row=1, column=col_idx, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.border = border
        
        for row_idx, daily in enumerate(report_data['daily_analysis'], 2):
            daily_ws.cell(row=row_idx, column=1, value=daily.get('visit_date', ''))
            daily_ws.cell(row=row_idx, column=2, value=daily.get('daily_visits', 0))
            daily_ws.cell(row=row_idx, column=3, value=daily.get('unique_daily_visitors', 0))
            daily_ws.cell(row=row_idx, column=4, value=daily.get('morning_visits', 0))
            daily_ws.cell(row=row_idx, column=5, value=daily.get('afternoon_visits', 0))
            daily_ws.cell(row=row_idx, column=6, value=daily.get('evening_visits', 0))
        
        # 5. Host Performance Sheet
        host_ws = wb.create_sheet("Host Performance")
        host_headers = ["Host Name", "Email", "Total Visits", "Unique Visitors", "Avg Duration (min)"]
        
        for col_idx, header in enumerate(host_headers, 1):
            cell = host_ws.cell(row=1, column=col_idx, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.border = border
        
        for row_idx, host in enumerate(report_data['host_performance'], 2):
            host_ws.cell(row=row_idx, column=1, value=host.get('host_name', ''))
            host_ws.cell(row=row_idx, column=2, value=host.get('host_email', ''))
            host_ws.cell(row=row_idx, column=3, value=host.get('total_visits', 0))
            host_ws.cell(row=row_idx, column=4, value=host.get('unique_visitors', 0))
            host_ws.cell(row=row_idx, column=5, value=host.get('avg_visit_duration', 0))
        
        # Auto-size columns for all sheets
        for ws in wb.worksheets:
            for column in ws.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                ws.column_dimensions[column_letter].width = adjusted_width
        
        # Save to temporary file and return
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
            wb.save(tmp_file.name)
            
            with open(tmp_file.name, 'rb') as excel_file:
                excel_data = excel_file.read()
            
            # Clean up temporary file
            os.unlink(tmp_file.name)
            
            response = Response(
                excel_data,
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                headers={
                    'Content-Disposition': f'attachment; filename=visitor-report-{datetime.now().strftime("%Y%m%d")}.xlsx',
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            )
            return response
            
    except Exception as e:
        logger.error(f"Excel export error: {e}")
        return jsonify({'message': 'Failed to generate Excel report', 'error': str(e)}), 500

def generate_comprehensive_html_report(report_data, start_date, end_date, user):
    """Generate comprehensive HTML report with all analytics"""
    overview = report_data['overview']
    recent_activity = report_data['recent_activity']
    purpose_analysis = report_data['purpose_analysis']
    daily_analysis = report_data['daily_analysis']
    host_performance = report_data['host_performance']
    
    # Generate recent activity table
    recent_activity_rows = ""
    for activity in recent_activity[:20]:  # Show top 20 for PDF
        recent_activity_rows += f"""
        <tr>
            <td>{activity.get('visitor_name', 'N/A')}</td>
            <td>{activity.get('visitor_email', 'N/A')}</td>
            <td>{activity.get('visitor_company', 'N/A')}</td>
            <td>{activity.get('host_name', 'N/A')}</td>
            <td>{activity.get('check_in_time', 'N/A')}</td>
            <td>{activity.get('purpose', 'N/A')}</td>
            <td><span class="status {activity.get('status', '').lower()}">{activity.get('status', 'N/A')}</span></td>
        </tr>
        """
    
    # Generate purpose analysis chart data
    purpose_chart_data = ""
    for purpose in purpose_analysis[:10]:  # Top 10 purposes
        percentage = (purpose.get('visit_count', 0) / max(overview.get('total_visits', 1), 1)) * 100
        purpose_chart_data += f"""
        <tr>
            <td>{purpose.get('purpose', 'N/A')}</td>
            <td>{purpose.get('visit_count', 0)}</td>
            <td>{purpose.get('unique_visitors', 0)}</td>
            <td>{round(percentage, 1)}%</td>
        </tr>
        """
    
    # Generate daily analysis chart
    daily_chart_data = ""
    for daily in daily_analysis[:14]:  # Last 14 days
        daily_chart_data += f"""
        <tr>
            <td>{daily.get('visit_date', 'N/A')}</td>
            <td>{daily.get('daily_visits', 0)}</td>
            <td>{daily.get('unique_daily_visitors', 0)}</td>
            <td>{daily.get('morning_visits', 0)}</td>
            <td>{daily.get('afternoon_visits', 0)}</td>
            <td>{daily.get('evening_visits', 0)}</td>
        </tr>
        """
    
    # Generate host performance data
    host_performance_data = ""
    for host in host_performance[:10]:  # Top 10 hosts
        host_performance_data += f"""
        <tr>
            <td>{host.get('host_name', 'N/A')}</td>
            <td>{host.get('total_visits', 0)}</td>
            <td>{host.get('unique_visitors', 0)}</td>
            <td>{round(host.get('avg_visit_duration', 0) or 0, 1)} min</td>
        </tr>
        """
    
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visitor Management System - Comprehensive Report</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
            background-color: #f8f9fa;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }}
        .header {{
            text-align: center;
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        .header h1 {{
            color: #007bff;
            margin: 0;
            font-size: 32px;
            font-weight: 700;
        }}
        .header h2 {{
            color: #666;
            margin: 10px 0 0 0;
            font-size: 18px;
            font-weight: 400;
        }}
        .meta-info {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        .meta-info .company {{
            font-size: 20px;
            font-weight: bold;
        }}
        .meta-info .period {{
            text-align: right;
        }}
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        .stat-card {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #007bff;
        }}
        .stat-card h3 {{
            margin: 0 0 10px 0;
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        .stat-card .value {{
            font-size: 28px;
            font-weight: bold;
            color: #007bff;
        }}
        .section {{
            margin-bottom: 40px;
        }}
        .section-title {{
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e9ecef;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        th {{
            background: #007bff;
            color: white;
            padding: 15px 10px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
        }}
        td {{
            padding: 12px 10px;
            border-bottom: 1px solid #e9ecef;
            font-size: 13px;
        }}
        tr:nth-child(even) {{
            background-color: #f8f9fa;
        }}
        tr:hover {{
            background-color: #e3f2fd;
        }}
        .status {{
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }}
        .status.checked_in {{
            background: #d4edda;
            color: #155724;
        }}
        .status.checked_out {{
            background: #cce5ff;
            color: #004085;
        }}
        .status.pending {{
            background: #fff3cd;
            color: #856404;
        }}
        .footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            color: #666;
            font-size: 12px;
        }}
        .page-break {{
            page-break-before: always;
        }}
        @media print {{
            body {{ margin: 0; background: white; }}
            .container {{ box-shadow: none; padding: 20px; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>VISITOR MANAGEMENT SYSTEM</h1>
            <h2>Comprehensive Analytics Report</h2>
        </div>
        
        <div class="meta-info">
            <div>
                <div class="company">{user['company_name']}</div>
                <div>Generated by: {user['name']}</div>
            </div>
            <div class="period">
                <div><strong>Report Period:</strong></div>
                <div>{start_date or 'All time'} to {end_date or 'Present'}</div>
                <div><strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
            </div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total Visits</h3>
                <div class="value">{overview.get('total_visits', 0):,}</div>
            </div>
            <div class="stat-card">
                <h3>Unique Visitors</h3>
                <div class="value">{overview.get('unique_visitors', 0):,}</div>
            </div>
            <div class="stat-card">
                <h3>Active Visits</h3>
                <div class="value">{overview.get('active_visits', 0):,}</div>
            </div>
            <div class="stat-card">
                <h3>Avg Duration</h3>
                <div class="value">{round(overview.get('avg_duration_minutes', 0) or 0, 1)}</div>
                <small>minutes</small>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">📈 Recent Visitor Activity</h2>
            <table>
                <thead>
                    <tr>
                        <th>Visitor Name</th>
                        <th>Email</th>
                        <th>Company</th>
                        <th>Host</th>
                        <th>Check In Time</th>
                        <th>Purpose</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {recent_activity_rows}
                </tbody>
            </table>
        </div>
        
        <div class="page-break"></div>
        
        <div class="section">
            <h2 class="section-title">🎯 Visit Purpose Analysis</h2>
            <table>
                <thead>
                    <tr>
                        <th>Purpose</th>
                        <th>Visit Count</th>
                        <th>Unique Visitors</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    {purpose_chart_data}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2 class="section-title">📊 Time-based Visitor Analysis</h2>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Total Visits</th>
                        <th>Unique Visitors</th>
                        <th>Morning (9-12)</th>
                        <th>Afternoon (13-17)</th>
                        <th>Evening (18-21)</th>
                    </tr>
                </thead>
                <tbody>
                    {daily_chart_data}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2 class="section-title">👥 Host Performance Analysis</h2>
            <table>
                <thead>
                    <tr>
                        <th>Host Name</th>
                        <th>Total Visits</th>
                        <th>Unique Visitors</th>
                        <th>Avg Duration</th>
                    </tr>
                </thead>
                <tbody>
                    {host_performance_data}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>This report was generated by the Visitor Management System on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
            <p>© 2025 Visitor Management System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """

def generate_html_report_content(data, start_date, end_date):
    """Generate simple HTML content for basic export"""
    # For backward compatibility, if data is the new comprehensive format, extract overview
    if isinstance(data, dict) and 'overview' in data:
        overview = data['overview']
        total_visits = overview.get('total_visits', 0)
        unique_visitors = overview.get('unique_visitors', 0)
    else:
        total_visits = 0
        unique_visitors = 0
    
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visitor Management System Report</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            line-height: 1.6;
        }}
        .header {{
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        .header h1 {{
            color: #007bff;
            margin: 0;
            font-size: 28px;
        }}
        .meta-info {{
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
        }}
        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }}
        .stat-card {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #007bff;
        }}
        .stat-card h3 {{
            margin: 0 0 10px 0;
            color: #666;
            font-size: 14px;
        }}
        .stat-card .value {{
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>VISITOR MANAGEMENT SYSTEM</h1>
        <h2>Analytics Report</h2>
    </div>
    <div class="meta-info">
        <strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}<br>
        <strong>Report Period:</strong> {start_date or 'All time'} to {end_date or 'Present'}
    </div>
    <div class="stats">
        <div class="stat-card">
            <h3>Total Visits</h3>
            <div class="value">{total_visits:,}</div>
        </div>
        <div class="stat-card">
            <h3>Unique Visitors</h3>
            <div class="value">{unique_visitors:,}</div>
        </div>
    </div>
    <p><em>For comprehensive analytics including Recent Visitor Activity, Visit Purpose Analysis, and Time-based Analysis, please use PDF or Excel export formats.</em></p>
</body>
</html>
    """

# ============== ADVANCED VISITOR FEATURES ENDPOINTS ==============

@app.route('/api/visitors/pre-register', methods=['POST'])
@authenticate_token
def pre_register_visitor():
    """Pre-register a visitor"""
    try:
        user = request.current_user
        data = request.get_json()
        
        # Extract data
        visitor_name = data['visitorName']
        visitor_email = data['visitorEmail']
        visitor_phone = data.get('visitorPhone', '')
        visitor_company = data.get('visitorCompany', '')
        host_name = data['hostName']
        visit_date = data['visitDate']
        visit_time = data['visitTime']
        purpose = data['purpose']
        duration = data.get('duration')
        is_recurring = data.get('isRecurring', False)
        recurring_pattern = data.get('recurringPattern')
        recurring_end_date = data.get('recurringEndDate')
        special_requirements = data.get('specialRequirements', '')
        emergency_contact = data.get('emergencyContact', '')
        vehicle_number = data.get('vehicleNumber', '')
        number_of_visitors = data.get('numberOfVisitors', 1)
        
        # Get company_id from companies table using user_id
        company_id = get_company_id_from_companies_table(user['id'])
        admin_company_name = user['company_name'] or 'Default Company'
        
        qr_code = generate_qr_code()
        
        # Clean empty values
        clean_recurring_end_date = recurring_end_date if recurring_end_date and recurring_end_date.strip() else None
        clean_recurring_pattern = recurring_pattern if recurring_pattern and recurring_pattern.strip() else None
        clean_duration = duration if duration and str(duration).strip() else None
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO pre_registrations (
                company_id, visitor_name, visitor_email, visitor_phone, visitor_company,
                company_to_visit, host_id, host_name, visit_date, visit_time, purpose, duration,
                is_recurring, recurring_pattern, recurring_end_date,
                special_requirements, emergency_contact, vehicle_number, 
                number_of_visitors, qr_code, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            company_id, visitor_name, visitor_email, visitor_phone, visitor_company,
            admin_company_name, user['id'], host_name, visit_date, visit_time, purpose, clean_duration,
            is_recurring, clean_recurring_pattern, clean_recurring_end_date,
            special_requirements, emergency_contact, vehicle_number,
            number_of_visitors, qr_code, datetime.now()
        ))
        
        pre_reg_id = cursor.lastrowid
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': 'Visitor pre-registered successfully',
            'id': pre_reg_id,
            'qrCode': qr_code
        }), 201
        
    except Exception as e:
        logger.error(f"Pre-registration error: {e}")
        
        error_message = 'Failed to pre-register visitor.'
        if 'Duplicate entry' in str(e):
            error_message = 'A visitor with this information already exists.'
        elif 'Data truncated' in str(e):
            error_message = 'Invalid data format. Please check all fields.'
        
        return jsonify({
            'message': error_message,
            'details': str(e) if app.debug else None
        }), 500

@app.route('/api/visitors/qr-checkin', methods=['POST'])
@authenticate_token
def qr_checkin():
    """QR Code verification endpoint"""
    try:
        user = request.current_user
        data = request.get_json()
        
        qr_code = data.get('qr_code')
        host_id = data.get('host_id')
        
        logger.info(f"QR verification request: {qr_code}, host_id: {host_id}, user: {user['id']}")
        
        if not qr_code:
            return jsonify({
                'success': False,
                'message': 'QR code is required'
            }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verify QR code in pre_registrations
        cursor.execute("""
            SELECT * FROM pre_registrations
            WHERE qr_code = %s AND status IN ('approved', 'pending')
        """, (qr_code,))
        
        pre_reg = cursor.fetchone()
        
        if not pre_reg:
            cursor.close()
            conn.close()
            return jsonify({
                'success': False,
                'message': 'QR code not found in pre-registrations or not approved'
            }), 404
        
        # Get host name
        host_name = 'Unknown Host'
        effective_host_id = host_id or pre_reg['host_id'] or user['id']
        
        if pre_reg['host_id']:
            cursor.execute("SELECT name FROM users WHERE id = %s", (pre_reg['host_id'],))
            host_result = cursor.fetchone()
            if host_result:
                host_name = host_result['name']
        elif pre_reg['host_name']:
            host_name = pre_reg['host_name']
        
        # Check if already checked in today
        today = datetime.now().date()
        cursor.execute("""
            SELECT id FROM visits 
            WHERE visitor_email = %s 
            AND DATE(check_in_time) = %s
            AND status = 'checked_in'
        """, (pre_reg['visitor_email'], today))
        
        existing_visit = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if existing_visit:
            return jsonify({
                'success': False,
                'message': 'Visitor already checked in today'
            }), 409
        
        # Return visitor data for form pre-fill
        return jsonify({
            'success': True,
            'message': 'QR code verified successfully',
            'visitor_name': pre_reg['visitor_name'],
            'visitor_email': pre_reg['visitor_email'],
            'visitor_phone': pre_reg['visitor_phone'],
            'visitor_company': pre_reg['visitor_company'],
            'purpose': pre_reg['purpose'],
            'host_name': host_name,
            'host_id': effective_host_id,
            'pre_registration_id': pre_reg['id'],
            'visit_date': pre_reg['visit_date'].isoformat() if pre_reg['visit_date'] else None,
            'visit_time': pre_reg['visit_time']
        }), 200
        
    except Exception as e:
        logger.error(f"QR verification error: {e}")
        return jsonify({
            'success': False,
            'message': 'Internal server error during QR verification',
            'error': str(e) if app.debug else None
        }), 500

@app.route('/api/visitors/pre-registrations', methods=['GET'])
@authenticate_token
def get_pre_registrations():
    """Get pre-registrations for the user's company"""
    try:
        user = request.current_user
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # First, let's check what columns actually exist in the table
        cursor.execute("SHOW COLUMNS FROM pre_registrations")
        columns = [row['Field'] for row in cursor.fetchall()]
        logger.info(f"Available pre_registrations columns: {columns}")
        
        # Build a safe query with only existing columns
        safe_columns = []
        possible_columns = [
            'id', 'company_id', 'visitor_name', 'visitor_email', 'visitor_phone', 
            'visitor_company', 'company_to_visit', 'host_name', 'host_id', 
            'visit_date', 'visit_time', 'purpose', 'duration', 'special_requirements', 
            'emergency_contact', 'vehicle_number', 'qr_code', 'status', 
            'created_at', 'updated_at', 'check_in_time', 'check_out_time',
            'number_of_visitors'
        ]
        
        for col in possible_columns:
            if col in columns:
                safe_columns.append(f'pr.{col}')
        
        if not safe_columns:
            # Fallback to basic columns that should exist
            safe_columns = ['pr.*']
        
        query = f"""
            SELECT {', '.join(safe_columns)}
            FROM pre_registrations pr
            WHERE pr.company_to_visit = %s
            ORDER BY pr.created_at DESC
        """
        
        cursor.execute(query, (user['company_name'],))
        pre_registrations = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Convert any datetime objects to ISO format strings and handle binary data
        processed_registrations = []
        for registration in pre_registrations:
            processed_registration = {}
            for key, value in registration.items():
                if value is None:
                    processed_registration[key] = None
                elif hasattr(value, 'isoformat'):
                    # Handle datetime objects
                    processed_registration[key] = value.isoformat()
                elif isinstance(value, (bytes, bytearray)):
                    # Handle binary data
                    try:
                        processed_registration[key] = value.decode('utf-8')
                    except UnicodeDecodeError:
                        # If it's not UTF-8, convert to base64
                        import base64
                        processed_registration[key] = base64.b64encode(value).decode('utf-8')
                elif hasattr(value, 'total_seconds'):
                    # Handle timedelta objects
                    processed_registration[key] = str(value)
                else:
                    processed_registration[key] = value
            processed_registrations.append(processed_registration)
        
        return jsonify(processed_registrations), 200
        
    except Exception as e:
        logger.error(f"Pre-registrations fetch error: {e}")
        return jsonify({
            'message': 'Failed to fetch pre-registrations.',
            'details': str(e) if app.debug else None
        }), 500

@app.route('/api/visitors/recurring', methods=['GET'])
@authenticate_token
def get_recurring_visitors():
    """Get recurring pre-registrations for the user's company"""
    try:
        user = request.current_user
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # First, let's check what columns actually exist in the table
        cursor.execute("SHOW COLUMNS FROM pre_registrations")
        columns = [row['Field'] for row in cursor.fetchall()]
        logger.info(f"Available pre_registrations columns: {columns}")
        
        # Build a safe query with only existing columns for recurring visitors
        safe_columns = []
        possible_columns = [
            'id', 'company_id', 'visitor_name', 'visitor_email', 'visitor_phone', 
            'visitor_company', 'company_to_visit', 'host_name', 'host_id', 
            'visit_date', 'visit_time', 'purpose', 'duration', 'special_requirements', 
            'emergency_contact', 'vehicle_number', 'qr_code', 'status', 
            'created_at', 'updated_at', 'check_in_time', 'check_out_time',
            'number_of_visitors', 'is_recurring', 'recurring_pattern', 'recurring_end_date'
        ]
        
        for col in possible_columns:
            if col in columns:
                safe_columns.append(f'pr.{col}')
        
        if not safe_columns:
            # Fallback to basic columns that should exist
            safe_columns = ['pr.*']
        
        # Check if is_recurring column exists
        has_recurring_column = 'is_recurring' in columns
        
        if has_recurring_column:
            query = f"""
                SELECT {', '.join(safe_columns)}
                FROM pre_registrations pr
                WHERE pr.company_to_visit = %s 
                AND pr.is_recurring = TRUE
                ORDER BY pr.created_at DESC
            """
        else:
            # If no is_recurring column, return empty array
            cursor.close()
            conn.close()
            return jsonify([]), 200
        
        cursor.execute(query, (user['company_name'],))
        recurring_registrations = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Convert any datetime objects to ISO format strings and handle binary data
        processed_registrations = []
        for registration in recurring_registrations:
            processed_registration = {}
            for key, value in registration.items():
                if value is None:
                    processed_registration[key] = None
                elif hasattr(value, 'isoformat'):
                    # Handle datetime objects
                    processed_registration[key] = value.isoformat()
                elif isinstance(value, (bytes, bytearray)):
                    # Handle binary data
                    try:
                        processed_registration[key] = value.decode('utf-8')
                    except UnicodeDecodeError:
                        # If it's not UTF-8, convert to base64
                        import base64
                        processed_registration[key] = base64.b64encode(value).decode('utf-8')
                elif hasattr(value, 'total_seconds'):
                    # Handle timedelta objects
                    processed_registration[key] = str(value)
                else:
                    processed_registration[key] = value
            processed_registrations.append(processed_registration)
        
        return jsonify(processed_registrations), 200
        
    except Exception as e:
        logger.error(f"Recurring visitors fetch error: {e}")
        return jsonify({
            'message': 'Failed to fetch recurring visitors.',
            'details': str(e) if app.debug else None
        }), 500

@app.route('/api/pre-registrations/<int:pre_registration_id>/badge', methods=['GET'])
@authenticate_token
def generate_visitor_badge(pre_registration_id):
    """Generate visitor badge for pre-registration"""
    try:
        user = request.current_user
        
        logger.info(f"Badge generation request for pre-registration ID: {pre_registration_id}")
        logger.info(f"User details: {user}")
        
        # Get pre-registration details
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True, buffered=True)
        
        try:
            # Dynamic column detection
            logger.info("Starting column detection...")
            cursor.execute("SHOW COLUMNS FROM pre_registrations")
            columns_info = cursor.fetchall()
            logger.info(f"Raw columns_info: {columns_info}")
            
            # Extract column names properly - columns_info is a list of dictionaries
            if columns_info and isinstance(columns_info[0], dict):
                available_columns = [col['Field'] for col in columns_info]
            else:
                # Fallback: assume it's a list of tuples
                available_columns = [col[0] for col in columns_info]
            
            logger.info(f"Available pre_registrations columns for badge: {available_columns}")
            
            # Define columns we want for badge generation
            badge_columns = [
                'id', 'visitor_name', 'visitor_email', 'visitor_phone', 'visitor_company',
                'company_to_visit', 'host_name', 'visit_date', 'visit_time', 'purpose',
                'qr_code', 'created_at', 'status', 'number_of_visitors'
            ]
            
            # Select only available columns
            selected_columns = [col for col in badge_columns if col in available_columns]
            logger.info(f"Selected columns for badge query: {selected_columns}")
            
            if not selected_columns:
                logger.error("No valid columns found for badge generation")
                return jsonify({'message': 'Database schema error'}), 500
            
            query = f"SELECT {', '.join(selected_columns)} FROM pre_registrations WHERE id = %s"
            logger.info(f"Executing badge query: {query} with ID: {pre_registration_id}")
            cursor.execute(query, (pre_registration_id,))
            pre_registration = cursor.fetchone()
            logger.info(f"Badge query result: {pre_registration}")
            
            if not pre_registration:
                logger.warning(f"Pre-registration not found: {pre_registration_id}")
                return jsonify({'message': 'Pre-registration not found'}), 404
            
            # Get user name safely
            user_name = user.get('name') or user.get('email', 'Unknown User')
            
            # Check if user has access to this pre-registration
            if user['role'] == 'host':
                # For hosts, check if they are the host for this pre-registration
                if 'host_name' in pre_registration and pre_registration['host_name'] != user_name:
                    logger.warning(f"Host {user_name} attempted to access badge for different host's pre-registration")
                    return jsonify({'message': 'Access denied'}), 403
            elif user['role'] == 'admin':
                # For admins, check company match
                if 'company_to_visit' in pre_registration and pre_registration['company_to_visit'] != user['company_name']:
                    logger.warning(f"Admin from {user['company_name']} attempted to access badge from different company")
                    return jsonify({'message': 'Access denied'}), 403
            
            # Process data for JSON serialization
            processed_data = {}
            for key, value in pre_registration.items():
                if value is None:
                    processed_data[key] = None
                elif isinstance(value, datetime):
                    processed_data[key] = value.isoformat()
                elif isinstance(value, (bytes, bytearray)):
                    processed_data[key] = value.decode('utf-8') if value else None
                elif hasattr(value, 'total_seconds'):
                    processed_data[key] = str(value)
                else:
                    processed_data[key] = value
            
            # Generate badge HTML content
            badge_html = f"""
            <div style="
                width: 380px;
                height: 520px;
                border: none;
                border-radius: 15px;
                padding: 0;
                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
                background: linear-gradient(145deg, #667eea 0%, #764ba2 100%);
                box-shadow: 0 8px 25px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1);
                margin: 0 auto;
                position: relative;
                overflow: hidden;
            ">
                <!-- Decorative Top Pattern -->
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 80px;
                    background: linear-gradient(45deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%);
                    clip-path: polygon(0 0, 100% 0, 100% 60%, 0 80%);
                "></div>
                
                <!-- Main Content Container -->
                <div style="
                    background: white;
                    margin: 15px;
                    border-radius: 12px;
                    height: calc(100% - 30px);
                    position: relative;
                    box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
                    padding: 25px 20px;
                ">
                    <!-- Header Section -->
                    <div style="text-align: center; margin-bottom: 25px;">
                        <div style="
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            background-clip: text;
                            font-size: 24px;
                            font-weight: 800;
                            letter-spacing: 2px;
                            margin-bottom: 8px;
                            text-transform: uppercase;
                        ">VISITOR</div>
                        <div style="
                            background: #f8f9fa;
                            color: #495057;
                            font-size: 12px;
                            padding: 6px 16px;
                            border-radius: 20px;
                            display: inline-block;
                            font-weight: 600;
                            letter-spacing: 1px;
                            text-transform: uppercase;
                        ">{processed_data.get('company_to_visit', 'Company')}</div>
                    </div>
                    
                    <!-- Visitor Photo Section -->
                    <div style="text-align: center; margin-bottom: 25px;">
                        <div style="
                            width: 100px;
                            height: 100px;
                            background: linear-gradient(135deg, #667eea20 0%, #764ba240 100%);
                            border-radius: 50%;
                            margin: 0 auto;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            border: 4px solid #ffffff;
                            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                            position: relative;
                        ">
                            <div style="
                                font-size: 14px;
                                color: #667eea;
                                font-weight: 600;
                                text-align: center;
                                line-height: 1.2;
                            ">
                                📷<br><span style="font-size: 10px;">PHOTO</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Visitor Information -->
                    <div style="text-align: center; margin-bottom: 25px;">
                        <div style="
                            font-size: 22px;
                            font-weight: 700;
                            color: #2d3748;
                            margin-bottom: 8px;
                            line-height: 1.2;
                        ">{processed_data.get('visitor_name', 'N/A')}</div>
                        <div style="
                            font-size: 14px;
                            color: #667eea;
                            font-weight: 600;
                            margin-bottom: 5px;
                        ">{processed_data.get('visitor_company', 'N/A')}</div>
                        <div style="
                            font-size: 12px;
                            color: #718096;
                            background: #f7fafc;
                            padding: 4px 12px;
                            border-radius: 15px;
                            display: inline-block;
                        ">{processed_data.get('visitor_email', 'N/A')}</div>
                    </div>
                    
                    <!-- Visit Details Card -->
                    <div style="
                        background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                        border-radius: 12px;
                        padding: 18px;
                        margin-bottom: 20px;
                        border: 1px solid #e2e8f0;
                        position: relative;
                    ">
                        <div style="
                            position: absolute;
                            top: -8px;
                            left: 20px;
                            background: white;
                            color: #667eea;
                            font-size: 10px;
                            font-weight: 700;
                            padding: 4px 12px;
                            border-radius: 12px;
                            border: 1px solid #e2e8f0;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        ">Visit Details</div>
                        
                        <div style="margin-top: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span style="font-weight: 600; color: #4a5568; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">👤 Host:</span>
                                <span style="color: #2d3748; font-size: 13px; font-weight: 600;">{processed_data.get('host_name', 'N/A')}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span style="font-weight: 600; color: #4a5568; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">🎯 Purpose:</span>
                                <span style="color: #2d3748; font-size: 13px; font-weight: 600;">{processed_data.get('purpose', 'N/A')}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span style="font-weight: 600; color: #4a5568; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">📅 Date:</span>
                                <span style="color: #2d3748; font-size: 13px; font-weight: 600;">{processed_data.get('visit_date', 'N/A')}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: 600; color: #4a5568; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">🕐 Time:</span>
                                <span style="color: #2d3748; font-size: 13px; font-weight: 600;">{processed_data.get('visit_time', 'N/A')}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- QR Code and Status Section -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <div style="text-align: center;">
                            <div style="
                                width: 70px;
                                height: 70px;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                margin: 0 auto 8px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 8px;
                                color: white;
                                border-radius: 8px;
                                box-shadow: 0 3px 10px rgba(102, 126, 234, 0.3);
                                position: relative;
                            ">
                                <div style="text-align: center; line-height: 1.1;">
                                    📱<br>
                                    <div style="font-size: 6px; margin-top: 2px;">QR CODE</div>
                                    <div style="font-size: 5px; margin-top: 1px; opacity: 0.8;">{processed_data.get('qr_code', 'N/A')[:8]}...</div>
                                </div>
                            </div>
                        </div>
                        
                        <div style="text-align: center; flex: 1; margin-left: 15px;">
                            <div style="
                                background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                                color: white;
                                font-size: 10px;
                                font-weight: 700;
                                padding: 8px 16px;
                                border-radius: 20px;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                box-shadow: 0 2px 8px rgba(72, 187, 120, 0.3);
                            ">{processed_data.get('status', 'PENDING')}</div>
                            <div style="
                                font-size: 10px;
                                color: #718096;
                                margin-top: 5px;
                                font-weight: 500;
                            ">Visitors: {processed_data.get('number_of_visitors', 1)}</div>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="
                        position: absolute;
                        bottom: 15px;
                        left: 20px;
                        right: 20px;
                        text-align: center;
                        font-size: 9px;
                        color: #a0aec0;
                        border-top: 1px solid #e2e8f0;
                        padding-top: 8px;
                        background: white;
                    ">
                        <div style="font-weight: 600;">ID: #{pre_registration_id}</div>
                        <div style="margin-top: 2px;">Generated: {datetime.now().strftime('%d %b %Y, %H:%M')} by {user_name}</div>
                    </div>
                </div>
                
                <!-- Security Strip -->
                <div style="
                    position: absolute;
                    bottom: 5px;
                    left: 5px;
                    right: 5px;
                    height: 3px;
                    background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%);
                    border-radius: 0 0 10px 10px;
                "></div>
            </div>
            """
            
            # Return both HTML and data for frontend compatibility
            badge_data = {
                'html': badge_html,
                'data': {
                    'preRegistrationId': pre_registration_id,
                    'visitorName': processed_data.get('visitor_name', 'N/A'),
                    'visitorEmail': processed_data.get('visitor_email', 'N/A'),
                    'visitorPhone': processed_data.get('visitor_phone', 'N/A'),
                    'visitorCompany': processed_data.get('visitor_company', 'N/A'),
                    'companyToVisit': processed_data.get('company_to_visit', 'N/A'),
                    'hostName': processed_data.get('host_name', 'N/A'),
                    'visitDate': processed_data.get('visit_date'),
                    'visitTime': processed_data.get('visit_time'),
                    'purpose': processed_data.get('purpose', 'N/A'),
                    'qrCode': processed_data.get('qr_code', ''),
                    'status': processed_data.get('status', 'pending'),
                    'numberOfVisitors': processed_data.get('number_of_visitors', 1),
                    'generatedAt': datetime.now().isoformat(),
                    'generatedBy': user_name
                }
            }
            
            logger.info(f"Badge generated successfully for pre-registration {pre_registration_id}")
            return jsonify(badge_data), 200
            
        finally:
            cursor.close()
            conn.close()
        
    except Exception as e:
        logger.error(f"Badge generation error: {e}")
        return jsonify({
            'message': 'Failed to generate visitor badge',
            'details': str(e) if app.debug else None
        }), 500

@app.route('/api/visitors/history', methods=['GET'])
@authenticate_token
def get_visitor_history():
    """Get visitor history - Admin only, filtered by admin's company"""
    try:
        user = request.current_user
        
        # Only admin users can access visitor history
        if user['role'] != 'admin':
            return jsonify({'message': 'Admin access required to view visitor history'}), 403
        
        # Get company_id from companies table using user_id
        company_id = get_company_id_from_companies_table(user['id'])
        company_name = user['company_name']
        
        limit = request.args.get('limit', 100)
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        visitor_email = request.args.get('visitorEmail')
        host_name = request.args.get('hostName')
        
        # Enhanced query to ensure we only get visits from the admin's company
        query = """
            SELECT v.*, vis.name as visitor_name, vis.email as visitor_email, 
                   vis.company as visitor_company, vis.is_blacklisted, u.name as host_name,
                   u.company_name as host_company,
                   CASE 
                     WHEN v.check_out_time IS NOT NULL THEN 'completed'
                     WHEN v.check_in_time IS NOT NULL THEN 'active'
                     ELSE 'pending'
                   END as status
            FROM visits v
            LEFT JOIN visitors vis ON v.visitor_id = vis.id
            LEFT JOIN users u ON v.host_id = u.id
            WHERE u.company_name = %s
        """
        
        params = [company_name]
        
        if start_date:
            query += " AND DATE(v.check_in_time) >= %s"
            params.append(start_date)
        
        if end_date:
            query += " AND DATE(v.check_in_time) <= %s"
            params.append(end_date)
        
        if visitor_email:
            query += " AND (vis.email LIKE %s OR v.visitor_email LIKE %s)"
            params.append(f"%{visitor_email}%")
            params.append(f"%{visitor_email}%")
        
        if host_name:
            query += " AND (u.name LIKE %s OR v.host_name LIKE %s)"
            params.append(f"%{host_name}%")
            params.append(f"%{host_name}%")
        
        query += " ORDER BY v.check_in_time DESC LIMIT %s"
        params.append(int(limit))
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params)
        history = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify(history), 200
        
    except Exception as e:
        logger.error(f"Visitor history error: {e}")
        return jsonify({'message': 'Failed to fetch visitor history'}), 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'Flask Visitor Management Backend'
    }), 200

# ============== ADMIN ENDPOINTS ==============

@app.route('/api/admin/settings', methods=['GET'])
@authenticate_token
def get_admin_settings():
    """Get system settings for admin dashboard"""
    try:
        user = request.current_user
        
        if user['role'] != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        # Get settings from database or use defaults
        settings = {
            'emailNotifications': True,
            'requireApproval': False,
            'maxVisitorsPerDay': 500,
            'retentionPeriodDays': 90,
            'allowSelfCheckout': True,
            'capturePhoto': True,
            'systemName': 'Visitor Management System',
            'companyLogo': '/assets/logo.png',
            'theme': 'light',
            'language': 'en',
            'timezone': 'UTC',
            'dateFormat': 'MM/DD/YYYY',
            'timeFormat': '12h',
            'lastUpdated': datetime.now().isoformat()
        }
        
        # Try to fetch from database if settings table exists
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Check if settings table exists
            cursor.execute("SHOW TABLES LIKE 'system_settings'")
            if cursor.fetchone():
                cursor.execute("SELECT * FROM system_settings LIMIT 1")
                db_settings = cursor.fetchone()
                
                if db_settings:
                    # Update settings with values from database
                    for key, value in db_settings.items():
                        if key in settings:
                            settings[key] = value
            
            cursor.close()
            conn.close()
        except Exception as db_error:
            logger.warning(f"Error fetching settings from database: {db_error}")
            # Continue with default settings
        
        return jsonify(settings), 200
        
    except Exception as e:
        logger.error(f"Get admin settings error: {e}")
        return jsonify({
            'emailNotifications': True,
            'requireApproval': False,
            'maxVisitorsPerDay': 500,
            'retentionPeriodDays': 90,
            'allowSelfCheckout': True,
            'capturePhoto': True,
            'systemName': 'Visitor Management System',
            'companyLogo': '/assets/logo.png',
            'theme': 'light',
            'language': 'en',
            'timezone': 'UTC',
            'dateFormat': 'MM/DD/YYYY',
            'timeFormat': '12h',
            'lastUpdated': datetime.now().isoformat()
        }), 200

@app.route('/api/admin/settings', methods=['PUT'])
@authenticate_token
def update_admin_settings():
    """Update system settings"""
    try:
        user = request.current_user
        
        if user['role'] != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        data = request.get_json()
        
        # Validate settings
        allowed_settings = [
            'emailNotifications', 'requireApproval', 'maxVisitorsPerDay',
            'retentionPeriodDays', 'allowSelfCheckout', 'capturePhoto',
            'systemName', 'companyLogo', 'theme', 'language', 'timezone',
            'dateFormat', 'timeFormat'
        ]
        
        filtered_settings = {k: v for k, v in data.items() if k in allowed_settings}
        
        # Try to update in database if settings table exists
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Check if settings table exists
            cursor.execute("SHOW TABLES LIKE 'system_settings'")
            if not cursor.fetchone():
                # Create settings table if it doesn't exist
                cursor.execute("""
                    CREATE TABLE system_settings (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        emailNotifications BOOLEAN DEFAULT TRUE,
                        requireApproval BOOLEAN DEFAULT FALSE,
                        maxVisitorsPerDay INT DEFAULT 500,
                        retentionPeriodDays INT DEFAULT 90,
                        allowSelfCheckout BOOLEAN DEFAULT TRUE,
                        capturePhoto BOOLEAN DEFAULT TRUE,
                        systemName VARCHAR(255) DEFAULT 'Visitor Management System',
                        companyLogo VARCHAR(255) DEFAULT '/assets/logo.png',
                        theme VARCHAR(50) DEFAULT 'light',
                        language VARCHAR(10) DEFAULT 'en',
                        timezone VARCHAR(50) DEFAULT 'UTC',
                        dateFormat VARCHAR(20) DEFAULT 'MM/DD/YYYY',
                        timeFormat VARCHAR(10) DEFAULT '12h',
                        lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Insert default values
                cursor.execute("""
                    INSERT INTO system_settings (emailNotifications, requireApproval, 
                    maxVisitorsPerDay, retentionPeriodDays, allowSelfCheckout, 
                    capturePhoto, systemName, companyLogo, theme, language, timezone, 
                    dateFormat, timeFormat) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    True, False, 500, 90, True, True, 
                    'Visitor Management System', '/assets/logo.png',
                    'light', 'en', 'UTC', 'MM/DD/YYYY', '12h'
                ))
            
            # Update settings in the database
            update_query = "UPDATE system_settings SET "
            update_values = []
            
            for key, value in filtered_settings.items():
                update_query += f"{key} = %s, "
                update_values.append(value)
            
            update_query += "lastUpdated = %s WHERE id = 1"
            update_values.append(datetime.now())
            
            cursor.execute(update_query, update_values)
            conn.commit()
            
            cursor.close()
            conn.close()
            
        except Exception as db_error:
            logger.warning(f"Error updating settings in database: {db_error}")
            # Continue without database update
        
        return jsonify({
            'message': 'Settings updated successfully',
            'settings': {**filtered_settings, 'lastUpdated': datetime.now().isoformat()}
        }), 200
        
    except Exception as e:
        logger.error(f"Update admin settings error: {e}")
        return jsonify({'message': 'Failed to update settings'}), 500

@app.route('/api/admin/audit-logs', methods=['GET'])
@authenticate_token
def get_audit_logs():
    """Get audit logs for admin monitoring"""
    try:
        user = request.current_user
        
        if user['role'] != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        # Get query parameters
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        action = request.args.get('action')
        username = request.args.get('username')
        limit = request.args.get('limit', 100)
        
        # Check if audit_logs table exists
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SHOW TABLES LIKE 'audit_logs'")
        if not cursor.fetchone():
            # Create sample audit log data
            mock_logs = []
            for i in range(10):
                days_ago = random.randint(0, 30)
                action_type = random.choice(['login', 'logout', 'create', 'update', 'delete', 'export'])
                mock_logs.append({
                    'id': i + 1,
                    'timestamp': (datetime.now() - timedelta(days=days_ago)).isoformat(),
                    'user': f"user{random.randint(1, 5)}@example.com",
                    'action': action_type,
                    'details': f"Sample {action_type} action",
                    'ip_address': f"192.168.1.{random.randint(1, 255)}"
                })
            
            cursor.close()
            conn.close()
            return jsonify(mock_logs), 200
        
        # Build query
        query = """
            SELECT * FROM audit_logs 
            WHERE company_name = %s
        """
        
        params = [user['company_name']]
        
        # Add filters
        if start_date:
            query += " AND DATE(timestamp) >= %s"
            params.append(start_date)
        
        if end_date:
            query += " AND DATE(timestamp) <= %s"
            params.append(end_date)
        
        if action:
            query += " AND action = %s"
            params.append(action)
        
        if username:
            query += " AND user LIKE %s"
            params.append(f"%{username}%")
        
        query += " ORDER BY timestamp DESC LIMIT %s"
        params.append(int(limit))
        
        cursor.execute(query, params)
        logs = cursor.fetchall()
        
        # Process datetime for JSON serialization
        for log in logs:
            if log.get('timestamp'):
                log['timestamp'] = log['timestamp'].isoformat()
        
        cursor.close()
        conn.close()
        
        return jsonify(logs), 200
        
    except Exception as e:
        logger.error(f"Get audit logs error: {e}")
        # Return mock data on error
        mock_logs = []
        for i in range(10):
            days_ago = random.randint(0, 30)
            action_type = random.choice(['login', 'logout', 'create', 'update', 'delete', 'export'])
            mock_logs.append({
                'id': i + 1,
                'timestamp': (datetime.now() - timedelta(days=days_ago)).isoformat(),
                'user': f"user{random.randint(1, 5)}@example.com",
                'action': action_type,
                'details': f"Sample {action_type} action",
                'ip_address': f"192.168.1.{random.randint(1, 255)}"
            })
        
        return jsonify(mock_logs), 200

@app.route('/api/admin/backups', methods=['GET'])
@authenticate_token
def get_backups():
    """Get list of database backups"""
    try:
        user = request.current_user
        
        if user['role'] != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        # Generate mock backup data since actual backup implementation would depend on server setup
        mock_backups = []
        for i in range(5):
            days_ago = i * 7  # Weekly backups
            backup_date = datetime.now() - timedelta(days=days_ago)
            size_mb = random.uniform(1.5, 10.0)
            
            mock_backups.append({
                'id': i + 1,
                'filename': f"vms_backup_{backup_date.strftime('%Y%m%d')}.sql",
                'created_at': backup_date.isoformat(),
                'size': f"{size_mb:.2f} MB",
                'status': 'completed',
                'download_url': f"/api/admin/backups/{i+1}/download"
            })
        
        return jsonify(mock_backups), 200
        
    except Exception as e:
        logger.error(f"Get backups error: {e}")
        return jsonify([]), 200

@app.route('/api/admin/backups/create', methods=['POST'])
@authenticate_token
def create_backup():
    """Create a new database backup"""
    try:
        user = request.current_user
        
        if user['role'] != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        # Mock backup creation (actual implementation would depend on server setup)
        backup_date = datetime.now()
        size_mb = random.uniform(1.5, 10.0)
        
        return jsonify({
            'id': random.randint(10, 100),
            'filename': f"vms_backup_{backup_date.strftime('%Y%m%d_%H%M%S')}.sql",
            'created_at': backup_date.isoformat(),
            'size': f"{size_mb:.2f} MB",
            'status': 'completed',
            'message': 'Backup created successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Create backup error: {e}")
        return jsonify({'message': 'Failed to create backup'}), 500

@app.route('/api/admin/backups/<int:backup_id>/download', methods=['GET'])
@authenticate_token
def download_backup(backup_id):
    """Download a specific backup file"""
    try:
        user = request.current_user
        
        if user['role'] != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        
        # Mock backup download (actual implementation would depend on server setup)
        # In a real system, you would retrieve the backup file and send it
        # Here we just create a simple mock SQL file
        
        mock_sql = f"""-- MySQL dump 10.13  Distrib 8.0.28, for Win64 (x86_64)
--
-- Host: localhost    Database: vms_db
-- ------------------------------------------------------
-- Server version    8.0.28

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'host',
  `company_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

-- Dump completed on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
        
        # Create a temporary file with the mock SQL content
        temp_file_path = os.path.join(os.path.dirname(__file__), f"temp_backup_{backup_id}.sql")
        with open(temp_file_path, 'w') as f:
            f.write(mock_sql)
        
        # Send the file and then delete it
        response = send_file(
            temp_file_path,
            as_attachment=True,
            attachment_filename=f"vms_backup_{datetime.now().strftime('%Y%m%d')}.sql",
            mimetype='application/sql'
        )
        
        # Delete the file after sending (in production, use a better cleanup mechanism)
        @response.call_on_close
        def on_close():
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
        
        return response
        
    except Exception as e:
        logger.error(f"Download backup error: {e}")
        return jsonify({'message': 'Failed to download backup'}), 500

# Test endpoint for host dashboard connectivity
@app.route('/api/test-host', methods=['GET'])
@authenticate_token
def test_host_endpoint():
    """Test endpoint specifically for host dashboard"""
    try:
        user = request.current_user
        
        logger.info(f"Test host endpoint called by user: {user}")
        
        # Also check if there are any visits for this host
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Count total visits for this host
        cursor.execute("SELECT COUNT(*) as count FROM visits WHERE host_id = %s", (user['id'],))
        visit_count = cursor.fetchone()
        
        # Get sample visit data
        cursor.execute("""
            SELECT v.id, v.visitor_name, v.visitor_email, v.check_in_time, v.status 
            FROM visits v 
            WHERE v.host_id = %s 
            ORDER BY v.check_in_time DESC 
            LIMIT 3
        """, (user['id'],))
        sample_visits = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'role': user['role'],
                'company_name': user['company_name']
            },
            'visit_statistics': {
                'total_visits': visit_count['count'] if visit_count else 0,
                'sample_visits': sample_visits
            },
            'message': 'Host test endpoint working',
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Test host endpoint error: {e}")
        return jsonify({
            'success': False,
            'message': 'Test endpoint failed',
            'error': str(e)
        }), 500

# Test endpoint for specific host ID debugging
@app.route('/api/test-host/<int:host_id>', methods=['GET'])
def test_specific_host(host_id):
    """Test endpoint to check specific host data"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get host details
        cursor.execute("SELECT * FROM users WHERE id = %s", (host_id,))
        host = cursor.fetchone()
        
        # Get visits for this host
        cursor.execute("""
            SELECT v.*, vis.name as visitor_name_from_visitors, h.name as host_name
            FROM visits v
            LEFT JOIN visitors vis ON v.visitor_id = vis.id
            LEFT JOIN users h ON v.host_id = h.id
            WHERE v.host_id = %s
            ORDER BY v.check_in_time DESC
        """, (host_id,))
        visits = cursor.fetchall()
        
        # Get total visit count for this host
        cursor.execute("SELECT COUNT(*) as total FROM visits WHERE host_id = %s", (host_id,))
        visit_count = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'requested_host_id': host_id,
            'host_details': host,
            'visits_for_host': visits,
            'total_visits_for_host': visit_count,
            'message': f'Host {host_id} has {visit_count["total"]} visits' if visit_count else 'No visit count data'
        })
    except Exception as e:
        logger.error(f"Test specific host endpoint error: {e}")
        return jsonify({
            'success': False,
            'message': 'Test failed',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=4000)

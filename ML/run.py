#!/usr/bin/env python3
"""
Visitor Management System - ML Service Entry Point
AI-powered ID Card Detection and Business Card Processing
"""

import os
import sys
import logging
from datetime import datetime
from flask import request, jsonify

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def main():
    """Main ML service entry point"""
    try:
        # Import the modular Flask ML application
        from src.AI_Agent import app
        from flask_cors import CORS
        logger.info("✅ Successfully imported modular ML application")
        
        # Configure CORS for the ML service
        CORS(app, 
             origins=['http://localhost:3000', 'http://visitors.pranathiss.com:3000', 'https://visitors.pranathiss.com:3000'],
             methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
             allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
             supports_credentials=True,
             expose_headers=['Content-Type', 'Authorization'])
        
        # Add explicit CORS headers for all responses
        @app.after_request
        def after_request(response):
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response
        
        # Handle preflight OPTIONS requests
        @app.before_request
        def handle_preflight():
            from flask import request, jsonify
            if request.method == "OPTIONS":
                response = jsonify()
                response.headers.add("Access-Control-Allow-Origin", "*")
                response.headers.add('Access-Control-Allow-Headers', "*")
                response.headers.add('Access-Control-Allow-Methods', "*")
                return response
        
        logger.info("✅ CORS configured for ML service")
        
        # Get configuration from environment variables
        host = os.getenv('ML_HOST', '0.0.0.0')
        port = int(os.getenv('ML_PORT', 5000))  # ML service runs on port 5000
        debug = os.getenv('ML_DEBUG', 'False').lower() == 'true'
        
        # Display startup information
        print("=" * 60)
        print("🤖 VISITOR MANAGEMENT SYSTEM - ML SERVICE")
        print("=" * 60)
        print(f"🚀 Starting ML AI Service...")
        print(f"📡 Server: http://{host}:{port}")
        print(f"🔧 Debug Mode: {'Enabled' if debug else 'Disabled'}")
        print(f"🧠 Features: ID Card Detection, Business Card Processing")
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        print("🔍 Available endpoints:")
        print("  POST /extract-id-number - Extract Aadhar/PAN from ID cards")
        print("  POST /upload - Extract data from business cards")
        print()
        
        # Create upload directory if it doesn't exist
        upload_dir = app.config['UPLOAD_FOLDER']
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir, exist_ok=True)
            logger.info(f"Created upload directory: {upload_dir}")
        
        # Run the Flask ML application
        app.run(
            host=host,
            port=port,
            debug=debug,
            threaded=True,
            use_reloader=debug
        )
        
    except ImportError as e:
        logger.error(f"❌ Failed to import ML application: {e}")
        print("❌ ERROR: Could not start the ML service")
        print("Please ensure all dependencies are installed:")
        print("pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Failed to start ML server: {e}")
        print(f"❌ ERROR: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
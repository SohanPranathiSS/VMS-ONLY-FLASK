#!/usr/bin/env python3
"""
Visitor Management System - Flask Backend Entry Point
Consolidated single entry point for the application
"""

import os
import sys
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def main():
    """Main application entry point"""
    try:
        # Import the working Flask application
        from app import app
        logger.info("✅ Successfully imported Flask application")
        
        # Get configuration from environment variables
        host = os.getenv('FLASK_HOST', '0.0.0.0')
        port = int(os.getenv('FLASK_PORT', 4000))  # Backend runs on port 4000
        debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
        
        # Display startup information
        print("=" * 60)
        print("🏢 VISITOR MANAGEMENT SYSTEM - BACKEND SERVER")
        print("=" * 60)
        print(f"🚀 Starting Flask Backend Server...")
        print(f"📡 Server: http://{host}:{port}")
        print(f"🔧 Debug Mode: {'Enabled' if debug else 'Disabled'}")
        print(f"💾 Database: {os.getenv('DB_NAME', 'vms_db')} on {os.getenv('DB_HOST', 'localhost')}")
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        print("📝 Available endpoints will be shown below...")
        print()
        
        # Run the Flask application
        app.run(
            host=host,
            port=port,
            debug=debug,
            threaded=True,
            use_reloader=debug
        )
        
    except ImportError as e:
        logger.error(f"❌ Failed to import Flask application: {e}")
        print("❌ ERROR: Could not start the application")
        print("Please ensure all dependencies are installed:")
        print("pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Failed to start server: {e}")
        print(f"❌ ERROR: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()

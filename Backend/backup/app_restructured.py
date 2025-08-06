"""
Flask VMS Application Entry Point
Restructured from monolithic app.py into modular architecture
"""

import sys
import os

# Add the current directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src import create_app
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Create application instance
app = create_app()

if app is None:
    logger.error("Failed to create Flask application")
    exit(1)

if __name__ == '__main__':
    # Development server configuration
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    port = int(os.getenv('FLASK_PORT', 5000))
    host = os.getenv('FLASK_HOST', '127.0.0.1')
    
    logger.info(f"Starting Flask VMS on {host}:{port} (debug={debug_mode})")
    
    app.run(
        host=host,
        port=port,
        debug=debug_mode,
        threaded=True
    )

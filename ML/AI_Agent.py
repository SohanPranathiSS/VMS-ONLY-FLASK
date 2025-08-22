"""
ML Service Flask Application
Modular AI-powered ID Card Detection and Business Card Processing
"""

import os
import sys
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add src directory to Python path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

try:
    from services.id_card_service import IDCardService
    from services.business_card_service import BusinessCardService
    from utils.image_utils import allowed_file
    from utils.config import UPLOAD_FOLDER, CORS_ORIGINS, DEFAULT_HOST, DEFAULT_PORT
except ImportError as e:
    logging.error(f"Import error: {e}")
    # Fallback to original monolithic version
    logging.warning("Using backup AI_Agent due to import issues")
    raise

from PIL import Image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Initialize Flask application
app = Flask(__name__)

# CORS configuration
CORS(app, resources={
    r"/extract-id-number": {"origins": CORS_ORIGINS}, 
    r"/upload": {"origins": CORS_ORIGINS}
})

# Configuration
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Initialize services
try:
    id_card_service = IDCardService()
    business_card_service = BusinessCardService()
    logger.info("✅ ML services initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize ML services: {e}")
    id_card_service = None
    business_card_service = None

@app.route('/extract-id-number', methods=['POST'])
def extract_id_number():
    """Extract Aadhar, PAN, and general numbers from an uploaded image"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not id_card_service:
        return jsonify({'error': 'ID card service not available'}), 503

    try:
        image = Image.open(file.stream)
        result = id_card_service.extract_id_numbers(image)
        return jsonify(result), 200

    except Exception as e:
        logger.error(f"❌ ID card extraction error: {e}")
        return jsonify({'error': f'Failed to process image: {str(e)}'}), 500

@app.route('/upload', methods=['POST'])
def upload_image():
    """Extract details from an image based on user prompt"""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Allowed types: jpg, jpeg, png"}), 400

    if not business_card_service:
        return jsonify({"error": "Business card service not available"}), 503

    try:
        image = Image.open(file.stream)
        prompt = request.form.get('prompt', '').strip()
        
        result = business_card_service.extract_business_card_data(image, prompt)
        return jsonify(result), 200
            
    except Exception as e:
        logger.error(f"❌ Business card extraction error: {e}")
        return jsonify({"error": f"An error occurred during processing: {e}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    status = {
        "status": "healthy",
        "services": {
            "id_card_service": id_card_service is not None,
            "business_card_service": business_card_service is not None
        }
    }
    
    if id_card_service:
        status["services"]["easyocr"] = id_card_service.easyocr_model.is_available()
        status["services"]["gemini"] = id_card_service.gemini_model.is_available()
    
    return jsonify(status), 200

@app.route('/', methods=['GET'])
def root():
    """Root endpoint with service information"""
    return jsonify({
        "service": "ML Service - AI-powered Document Processing",
        "version": "1.0.0",
        "endpoints": {
            "/extract-id-number": "POST - Extract Aadhar/PAN from ID cards",
            "/upload": "POST - Extract data from business cards",
            "/health": "GET - Service health check"
        },
        "status": "running"
    }), 200

if __name__ == '__main__':
    # Create upload directory if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Get configuration from environment
    host = os.getenv('ML_HOST', DEFAULT_HOST)
    port = int(os.environ.get('PORT', DEFAULT_PORT))
    debug = os.getenv('ML_DEBUG', 'False').lower() == 'true'
    
    logger.info(f"🚀 Starting ML Service on {host}:{port}")
    
    app.run(
        host=host,
        port=port,
        debug=debug,
        threaded=True
    )

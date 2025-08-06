"""
EasyOCR Model Handler
Handles OCR operations using EasyOCR
"""

import easyocr
import logging
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.config import EASYOCR_LANGUAGES, EASYOCR_GPU, EASYOCR_DOWNLOAD_ENABLED

# Suppress EasyOCR info logs to hide CPU warning
logging.getLogger('easyocr').setLevel(logging.WARNING)

class EasyOCRModel:
    """Handler for EasyOCR operations"""
    
    def __init__(self):
        """Initialize EasyOCR reader"""
        self.reader = None
        self._initialize_reader()
    
    def _initialize_reader(self):
        """Initialize the EasyOCR reader with configuration"""
        try:
            self.reader = easyocr.Reader(
                EASYOCR_LANGUAGES, 
                gpu=EASYOCR_GPU, 
                model_storage_directory=None, 
                download_enabled=EASYOCR_DOWNLOAD_ENABLED
            )
            logging.info("✅ EasyOCR reader initialized successfully")
        except Exception as e:
            logging.error(f"❌ Failed to initialize EasyOCR: {e}")
            raise
    
    def extract_text(self, image_np, detail=False, paragraph=False):
        """Extract text from image using EasyOCR"""
        if self.reader is None:
            raise RuntimeError("EasyOCR reader not initialized")
        
        try:
            results = self.reader.readtext(image_np, detail=detail, paragraph=paragraph)
            return results
        except Exception as e:
            logging.error(f"❌ EasyOCR text extraction failed: {e}")
            raise
    
    def is_available(self):
        """Check if EasyOCR is available and initialized"""
        return self.reader is not None

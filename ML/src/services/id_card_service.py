"""
ID Card Processing Service
Handles ID card detection and number extraction
"""

import re
import logging
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.easyocr_model import EasyOCRModel
from models.gemini_model import GeminiModel
from utils.image_utils import preprocess_and_rotate
from utils.text_extraction import extract_text_and_numbers

class IDCardService:
    """Service for processing ID cards and extracting numbers"""
    
    def __init__(self):
        """Initialize the ID card processing service"""
        self.easyocr_model = EasyOCRModel()
        self.gemini_model = GeminiModel()
    
    def extract_id_numbers(self, image):
        """Extract Aadhar, PAN, and general numbers from an uploaded image"""
        try:
            processed_img, _, gemini_img = preprocess_and_rotate(image)

            # Try Gemini first if available
            if self.gemini_model.is_available():
                try:
                    gemini_result = self.gemini_model.extract_data(
                        gemini_img, "", extraction_type='id_card'
                    )
                    # Validate Gemini response
                    if isinstance(gemini_result, dict) and all(
                        key in gemini_result for key in ['Aadhar', 'PAN', 'General Numbers']
                    ):
                        logging.info("✅ Gemini successfully extracted ID card data")
                        return gemini_result
                except Exception as e:
                    logging.warning(f"⚠️ Gemini failed for ID extraction: {e}")

            # Fallback to EasyOCR
            logging.info("🔄 Falling back to EasyOCR for ID card extraction")
            number_results, _ = extract_text_and_numbers(processed_img, self.easyocr_model.reader)
            cleaned_numbers = [re.sub(r'\s+', '', num) for num in number_results]

            response = {
                'Aadhar': [num for num in cleaned_numbers if re.match(r'^\d{12}$', num)],
                'PAN': [num for num in cleaned_numbers if re.match(r'^[A-Z]{5}\d{4}[A-Z]$', num)],
                'General Numbers': cleaned_numbers
            }
            
            logging.info("✅ EasyOCR successfully extracted ID card data")
            return response

        except Exception as e:
            logging.error(f"❌ Failed to process ID card: {e}")
            raise Exception(f'Failed to process image: {str(e)}')

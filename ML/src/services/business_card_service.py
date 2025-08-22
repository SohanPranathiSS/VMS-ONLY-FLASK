"""
Business Card Processing Service
Handles business card data extraction
"""

import logging
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.easyocr_model import EasyOCRModel
from models.gemini_model import GeminiModel
from utils.image_utils import preprocess_and_rotate
from utils.text_extraction import (
    extract_custom_data, extract_email, extract_mobile_number, 
    extract_company_number, extract_website, extract_name_and_designation,
    extract_company_name, extract_address
)
from utils.config import PLACEHOLDER_PHRASES, PUBLIC_EMAIL_DOMAINS

class BusinessCardService:
    """Service for processing business cards and extracting contact information"""
    
    def __init__(self):
        """Initialize the business card processing service"""
        self.easyocr_model = EasyOCRModel()
        self.gemini_model = GeminiModel()
    
    def extract_business_card_data(self, image, prompt=None):
        """Extract details from a business card image based on user prompt"""
        try:
            processed_img, _, gemini_img = preprocess_and_rotate(image)

            # Try Gemini first if available
            if self.gemini_model.is_available():
                try:
                    gemini_result = self.gemini_model.extract_data(
                        gemini_img, prompt, extraction_type='business_card'
                    )
                    # Validate Gemini response
                    if isinstance(gemini_result, dict):
                        logging.info("✅ Gemini successfully extracted business card data")
                        return gemini_result
                except Exception as e:
                    logging.warning(f"⚠️ Gemini failed for business card extraction: {e}")

            # Fallback to EasyOCR
            logging.info("🔄 Falling back to EasyOCR for business card extraction")
            results = self.easyocr_model.extract_text(processed_img, detail=False, paragraph=False)
            filtered_results = [line for line in results if line.lower().strip() not in PLACEHOLDER_PHRASES]

            if prompt:
                # Use prompt-based extraction with EasyOCR
                response_data = extract_custom_data(filtered_results, prompt)
            else:
                # Default behavior: extract business card details with EasyOCR
                response_data = self._extract_default_business_card_data(filtered_results)

            logging.info("✅ EasyOCR successfully extracted business card data")
            return response_data

        except Exception as e:
            logging.error(f"❌ Failed to process business card: {e}")
            raise Exception(f"An error occurred during processing: {e}")
    
    def _extract_default_business_card_data(self, filtered_results):
        """Extract default business card fields using EasyOCR results"""
        full_text = ' '.join(filtered_results)
        
        # Extract individual fields
        email = extract_email(full_text)
        mobile_number = extract_mobile_number(full_text)
        company_number = extract_company_number(full_text)
        website = extract_website(full_text)
        name, designation = extract_name_and_designation(filtered_results)
        company = extract_company_name(filtered_results)

        # Smart company name extraction from email if not found
        if company == "Not Found" and email:
            domain = email.split('@')[1]
            if domain.lower() not in PUBLIC_EMAIL_DOMAINS:
                tlds = ['.com', '.in', '.org', '.net', '.co.uk', '.co.in', '.co']
                for tld in sorted(tlds, key=len, reverse=True):
                    if domain.endswith(tld):
                        domain = domain[:-len(tld)]
                        break
                company = domain.replace('-', ' ').title()

        address = extract_address(filtered_results)
        
        return {
            "name": name if name else "Not Found",
            "designation": designation if designation else "Not Found",
            "company": company if company else "Not Found",
            "email": email if email else "Not Found",
            "personal_mobile_number": mobile_number if mobile_number else "Not Found",
            "company_number": company_number if company_number else "Not Found",
            "website": website if website else "Not Found",
            "address": address if address else "Not Found",
        }

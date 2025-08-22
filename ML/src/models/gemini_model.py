"""
Gemini AI Model Handler
Handles AI operations using Google's Gemini API
"""

import google.generativeai as genai
import json
import base64
import io
import logging
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.config import GOOGLE_API_KEY, GEMINI_MODEL

class GeminiModel:
    """Handler for Gemini AI operations"""
    
    def __init__(self):
        """Initialize Gemini model"""
        self.model = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the Gemini model with API key"""
        try:
            if not GOOGLE_API_KEY:
                raise ValueError("GOOGLE_API_KEY environment variable not set")
            
            genai.configure(api_key=GOOGLE_API_KEY)
            self.model = genai.GenerativeModel(GEMINI_MODEL)
            logging.info("✅ Gemini AI model initialized successfully")
        except Exception as e:
            logging.warning(f"⚠️ Failed to initialize Gemini API: {e}")
            self.model = None
    
    def extract_data(self, image, prompt, extraction_type='business_card'):
        """Extract data using Gemini API based on the prompt or extraction type"""
        if not self.model:
            raise ValueError("Gemini API not initialized")

        try:
            # Convert PIL Image to base64 for Gemini
            buffered = io.BytesIO()
            image.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

            # Default prompt for business card or ID card if none provided
            if not prompt:
                if extraction_type == 'business_card':
                    prompt = """
                    Analyze this business card image and extract all visible text information. Return a JSON object with these exact fields:

                    {
                        "name": "Full person name",
                        "designation": "Job title/position", 
                        "company": "Company name with any taglines",
                        "email": "Email address",
                        "personal_mobile_number": "Personal/mobile phone",
                        "company_number": "Office/company phone", 
                        "website": "Website URL",
                        "address": "Complete address with street, city, state, zip",
                        
                    }

                    IMPORTANT INSTRUCTIONS:
                    - Extract ALL visible text from the image
                    - Look for text near phone, email, location, and social media icons  
                    - For addresses: combine all address lines into one complete address
                    - For LinkedIn: extract handles like "/in/username" or full URLs
                    - For company: include main name plus any taglines in parentheses
                    - For phone numbers: preserve original formatting with area codes
                    - If information is not visible, use "Not Found" as the value
                    - Return only valid JSON, no explanations
                    - Extract the information sequentially as (Name,Email,Personal Mobile Number ,Company ,Company Number ,Address ,Website, etc)

                    Focus on accuracy and completeness of extraction.
                    """
                else:  # id_card
                    prompt = """
                    Extract Aadhar or PAN numbers from this ID card image. Return a JSON object with fields: 
                    Aadhar (list of 12-digit numbers), PAN (list of 10-character alphanumeric codes), General Numbers (all detected numbers). 
                    If no numbers are found, return empty lists. Ensure the output is valid JSON.
                    """

            # Prepare the Gemini request
            response = self.model.generate_content([
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": "image/png",
                        "data": img_base64
                    }
                }
            ])

            # Extract JSON from the response
            if not response or not response.text:
                raise ValueError("Gemini returned empty response")
            
            json_str = response.text.strip()
            logging.info(f"🔍 Raw Gemini response length: {len(json_str)} chars")
            logging.info(f"🔍 Raw Gemini response preview: {json_str[:300]}...")  # Log first 300 chars
            
            # Clean up potential markdown or extra text
            original_json_str = json_str
            if json_str.startswith('```json'):
                json_str = json_str[7:].rstrip('```').strip()
                logging.info("🧹 Removed ```json``` wrapper")
            elif json_str.startswith('```'):
                json_str = json_str[3:].rstrip('```').strip()
                logging.info("🧹 Removed ``` wrapper")
            
            # Try to find JSON if it's embedded in text
            if not json_str.startswith('{'):
                # Look for JSON object in the response
                start_pos = json_str.find('{')
                end_pos = json_str.rfind('}')
                if start_pos != -1 and end_pos != -1 and end_pos > start_pos:
                    json_str = json_str[start_pos:end_pos+1]
                    logging.info("🔍 Extracted JSON from embedded text")
            
            try:
                result = json.loads(json_str)
                logging.info(f"✅ Successfully parsed Gemini JSON with {len(result)} fields")
                
                # Log field extraction summary
                found_fields = [k for k, v in result.items() if v and v != "Not Found"]
                not_found_fields = [k for k, v in result.items() if not v or v == "Not Found"]
                logging.info(f"📊 Extracted fields: {found_fields}")
                logging.info(f"❌ Missing fields: {not_found_fields}")
                
                return result
            except json.JSONDecodeError as json_error:
                logging.error(f"❌ JSON parsing failed: {json_error}")
                logging.error(f"❌ Cleaned JSON string: {json_str}")
                logging.error(f"❌ Original response: {original_json_str}")
                raise ValueError(f"Gemini returned invalid JSON: {json_str}")

        except Exception as e:
            logging.error(f"❌ Gemini API error: {str(e)}")
            raise Exception(f"Gemini API error: {str(e)}")
    
    def is_available(self):
        """Check if Gemini AI is available and initialized"""
        return self.model is not None

"""
ML Service Configuration
Contains all configuration settings and constants
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Server Configuration
DEFAULT_HOST = '0.0.0.0'
DEFAULT_PORT = 5000
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}

# API Configuration
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')
GEMINI_MODEL = 'gemini-1.5-flash'  # Use gemini-1.5-pro for better performance

# CORS Configuration
CORS_ORIGINS = [
    "http://localhost:3000", 
    "http://localhost:8000"
]

# EasyOCR Configuration
EASYOCR_LANGUAGES = ['en']
EASYOCR_GPU = False
EASYOCR_DOWNLOAD_ENABLED = True

# Placeholder phrases to ignore during text extraction
PLACEHOLDER_PHRASES = {
    'your name here', 'your name', 'company name', 'your company name', 'job position',
    'your position here', 'email address goes here', 'website goes here',
    'address goes here, your city', 'address goes here', 'your logo', 'company tagline',
    '123 anywhere st., any city'
}

# Public email domains to avoid misinterpreting as company names
PUBLIC_EMAIL_DOMAINS = {
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 
    'icloud.com', 'protonmail.com'
}

# Regex patterns for data extraction
PATTERNS = {
    'aadhar': r'\b(?:\d{4}\s?\d{4}\s?\d{4}|\d{12})\b',
    'pan': r'\b[A-Z]{5}\d{4}[A-Z]\b',
    'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    'mobile': [
        r'(?:m|mob|mobile)?[:\s]*(\+91[-\s]?)?([6-9]\d{9})\b',
        r'\b([6-9]\d{9})\b'
    ],
    'company_number': [
        r'(?:tel|phone|ph|o|office|work|fax)[:\s]*([\+]\d{1,3}[-\s]?)?(\(?\d{2,5}\)?[-\s]?\d{6,8}(\s*(?:ext|extension|x)[-:\s]*\d+)?)',
        r'(\+91[-\s]*(?:0?[1-5]\d|40|80|11|22|33|44)[-\s]*\d{6,8})(\s*(?:ext|extension|x)[-:\s]*\d+)?'
    ],
    'website': r'\b(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9:%._\+~#=]{2,256}\.[a-zA-Z]{2,6}\b',
    'pincode': r'\b(\d{6})\b'
}

# Keywords for data extraction
KEYWORDS = {
    'company': [
        'pvt', 'ltd', 'limited', 'llp', 'inc', 'corp', 'solutions', 'services', 
        'industries', 'group', 'associates', 'consulting', 'global', 'technologies', 'software'
    ],
    'designation': [
        'director', 'manager', 'engineer', 'strategy', 'delivery', 'officer', 'ceo', 'cto', 
        'cfo', 'coo', 'founder', 'partner', 'consultant', 'president', 'executive', 
        'analyst', 'developer', 'designer', 'architect', 'head', 'lead', 'specialist', 'project manager'
    ],
    'address': [
        'block', 'house', 'road', 'street', 'avenue', 'lane', 'floor', 'building', 
        'marg', 'sector', 'pincode', 'india', r'\b\d{5,6}\b', 'nagar', 'park', 'ave'
    ],
    'non_name': [
        '@', '.com', 'www', 'http', '+', 'tel', 'mob', 'email', 'website',
        'pvt', 'ltd', 'inc', 'corp', 'solutions', 'services', 'technologies', 'industries', 'llp', 'group',
        'road', 'street', 'floor', 'lane', 'marg', 'sector', 'pincode', 'nagar', 'house', 
        'block', 'building', 'avenue', 'india'
    ],
    'non_address': ['@', 'www', '.com', 'phone', 'mobile', 'email', 'pvt', 'ltd', r'\+91', 'director', 'manager']
}

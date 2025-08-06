"""
Image Processing Utilities
Contains functions for image preprocessing and validation
"""

import numpy as np
import cv2
import io
from PIL import Image
from .config import ALLOWED_EXTENSIONS

def allowed_file(filename):
    """Checks if the uploaded file has an allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess_and_rotate(image):
    """Preprocesses the image for better OCR/Gemini results, including rotation."""
    img = np.array(image.convert("RGB"))
    
    # Rotate image if it's taller than it is wide
    h, w, _ = img.shape
    if h > w:
        img = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)
        
    # Convert to grayscale and apply sharpening
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    sharpen_kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
    sharp = cv2.filter2D(gray, -1, sharpen_kernel)
    
    # Apply thresholding
    _, thresh = cv2.threshold(sharp, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Save preprocessed image to a temporary file for Gemini
    _, buffer = cv2.imencode('.png', img)
    temp_image = Image.open(io.BytesIO(buffer))
    
    return thresh, img, temp_image

def image_to_base64(image):
    """Convert PIL Image to base64 string for API transmission."""
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    return buffered.getvalue()

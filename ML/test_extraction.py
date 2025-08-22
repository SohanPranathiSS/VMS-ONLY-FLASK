"""
Direct test of business card extraction with detailed logging
"""

import sys
import os
import logging
from PIL import Image

# Setup logging to see detailed output
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Add src directory to path
sys.path.insert(0, 'src')

from services.business_card_service import BusinessCardService

def test_business_card_extraction():
    """Test business card extraction directly"""
    
    print("🧪 Testing Business Card Extraction")
    print("=" * 50)
    
    # Initialize service
    try:
        service = BusinessCardService()
        print(f"✅ Service initialized")
        print(f"🤖 Gemini available: {service.gemini_model.is_available()}")
        print(f"👁️ EasyOCR available: {service.easyocr_model.is_available()}")
    except Exception as e:
        print(f"❌ Failed to initialize service: {e}")
        return
    
    # Test with a sample image (you'll need to provide the path)
    image_path = input("\nEnter path to business card image: ").strip().strip('"')
    
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        return
    
    try:
        # Load image
        image = Image.open(image_path)
        print(f"📷 Loaded image: {image.size}")
        
        # Extract data
        print("\n🔍 Starting extraction...")
        result = service.extract_business_card_data(image)
        
        # Display results
        print("\n📋 EXTRACTION RESULTS:")
        print("=" * 50)
        
        for field, value in result.items():
            status = "✅" if value != "Not Found" else "❌"
            field_name = field.replace('_', ' ').title()
            print(f"{status} {field_name:<20}: {value}")
        
        # Summary
        found_count = sum(1 for v in result.values() if v != "Not Found")
        total_count = len(result)
        success_rate = (found_count / total_count) * 100
        
        print(f"\n📊 SUMMARY:")
        print(f"Found: {found_count}/{total_count} fields ({success_rate:.1f}%)")
        
        if found_count < total_count:
            print("\n💡 TROUBLESHOOTING TIPS:")
            print("- Ensure image is clear and well-lit")
            print("- Check if text is legible and not too small")
            print("- Verify all information is actually visible in the image")
            print("- Try with a higher resolution image")
        
    except Exception as e:
        print(f"❌ Extraction failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_business_card_extraction()

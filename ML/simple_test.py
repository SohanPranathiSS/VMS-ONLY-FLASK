"""
Simple Business Card Test via API
"""

import requests
import json
from pathlib import Path

def test_business_card_api():
    """Test business card extraction via the running ML service API"""
    
    print("🧪 Business Card API Test")
    print("=" * 40)
    
    # Get image path from user
    image_path = input("Enter path to your business card image: ").strip().strip('"')
    
    if not Path(image_path).exists():
        print(f"❌ File not found: {image_path}")
        return
    
    try:
        # Test the upload endpoint
        url = "http://localhost:5000/upload"
        
        with open(image_path, 'rb') as f:
            files = {'file': f}
            data = {'prompt': ''}  # Use default extraction
            
            print("\n🚀 Sending request to ML service...")
            response = requests.post(url, files=files, data=data, timeout=30)
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            print("\n✅ EXTRACTION SUCCESSFUL!")
            print("=" * 50)
            
            # Group results by status
            found_fields = {}
            missing_fields = {}
            
            for field, value in result.items():
                field_display = field.replace('_', ' ').title()
                if value and value != "Not Found":
                    found_fields[field_display] = value
                else:
                    missing_fields[field_display] = value
            
            # Show found information
            if found_fields:
                print("🎯 SUCCESSFULLY EXTRACTED:")
                for field, value in found_fields.items():
                    print(f"  ✅ {field:<20}: {value}")
            
            # Show missing information  
            if missing_fields:
                print(f"\n❌ NOT FOUND ({len(missing_fields)} fields):")
                for field, value in missing_fields.items():
                    print(f"  ❌ {field}")
            
            # Statistics
            total_fields = len(result)
            found_count = len(found_fields)
            success_rate = (found_count / total_fields) * 100
            
            print(f"\n📊 EXTRACTION SUMMARY:")
            print(f"  📈 Success Rate: {success_rate:.1f}% ({found_count}/{total_fields})")
            
            if success_rate < 80:
                print(f"\n💡 IMPROVEMENT SUGGESTIONS:")
                print(f"  📷 Ensure image is high quality and well-lit")
                print(f"  🔍 Check that all text is clearly visible")
                print(f"  📐 Try a higher resolution scan/photo")
                print(f"  🎯 Verify the business card layout is standard")
            
        else:
            print(f"❌ API Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"❌ Details: {error_data}")
            except:
                print(f"❌ Response: {response.text}")
    
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed. Is the ML service running on http://localhost:5000?")
    except requests.exceptions.Timeout:
        print("❌ Request timed out. Image processing may be taking too long.")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    test_business_card_api()

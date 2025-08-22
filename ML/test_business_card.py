#!/usr/bin/env python3
"""
Test script for business card extraction
"""

import requests
import json
from pathlib import Path

def test_business_card_extraction():
    """Test business card extraction with the ML service"""
    
    # ML service URL
    url = "http://localhost:5000/upload"
    
    # Test with a sample business card image
    # You can replace this with the path to your business card image
    image_path = input("Enter the path to your business card image: ").strip()
    
    if not Path(image_path).exists():
        print(f"❌ Image file not found: {image_path}")
        return
    
    try:
        # Prepare the request
        with open(image_path, 'rb') as f:
            files = {'file': f}
            data = {'prompt': ''}  # Empty prompt to use default extraction
            
            print("🚀 Sending request to ML service...")
            response = requests.post(url, files=files, data=data)
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Business card extraction successful!")
            print("\n📋 Extracted Information:")
            print("=" * 50)
            
            for field, value in result.items():
                status = "✅" if value != "Not Found" else "❌"
                print(f"{status} {field.replace('_', ' ').title()}: {value}")
            
            # Count successful extractions
            found_count = sum(1 for v in result.values() if v != "Not Found")
            total_count = len(result)
            print(f"\n📊 Extraction Summary: {found_count}/{total_count} fields found")
            
        else:
            print(f"❌ Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"❌ Error details: {error_data}")
            except:
                print(f"❌ Error response: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to ML service. Make sure it's running on http://localhost:5000")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def test_health_check():
    """Test the health check endpoint"""
    try:
        response = requests.get("http://localhost:5000/health")
        if response.status_code == 200:
            health_data = response.json()
            print("🏥 Health Check:")
            print(f"  Status: {health_data.get('status', 'unknown')}")
            print("  Services:")
            for service, status in health_data.get('services', {}).items():
                status_icon = "✅" if status else "❌"
                print(f"    {status_icon} {service}: {status}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except:
        print("❌ Could not perform health check")

if __name__ == "__main__":
    print("🧪 Business Card Extraction Test")
    print("=" * 40)
    
    # First check if service is healthy
    test_health_check()
    print()
    
    # Then test business card extraction
    test_business_card_extraction()

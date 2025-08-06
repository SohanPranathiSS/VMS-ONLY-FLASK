#!/usr/bin/env python3
"""
Dependency Test Script
Tests if all required packages can be imported successfully
"""

import sys
import importlib

def test_import(module_name, package_name=None):
    """Test if a module can be imported"""
    try:
        importlib.import_module(module_name)
        print(f"✅ {package_name or module_name}")
        return True
    except ImportError as e:
        print(f"❌ {package_name or module_name}: {e}")
        return False

def main():
    """Test all required dependencies"""
    print("🔍 Testing Visitor Management System Dependencies")
    print("=" * 60)
    
    # Track success/failure
    success_count = 0
    total_count = 0
    
    # Core Flask dependencies
    print("\n📦 Core Flask Framework")
    print("-" * 30)
    tests = [
        ("flask", "Flask"),
        ("flask_cors", "Flask-CORS"),
        ("werkzeug.security", "Werkzeug Security"),
        ("werkzeug.utils", "Werkzeug Utils"),
    ]
    
    for module, name in tests:
        total_count += 1
        if test_import(module, name):
            success_count += 1
    
    # Authentication & Security
    print("\n🔐 Authentication & Security")
    print("-" * 30)
    tests = [
        ("jwt", "PyJWT"),
        ("dotenv", "python-dotenv"),
    ]
    
    for module, name in tests:
        total_count += 1
        if test_import(module, name):
            success_count += 1
    
    # Database
    print("\n💾 Database")
    print("-" * 30)
    tests = [
        ("mysql.connector", "MySQL Connector"),
        ("mysql.connector.pooling", "MySQL Connection Pooling"),
    ]
    
    for module, name in tests:
        total_count += 1
        if test_import(module, name):
            success_count += 1
    
    # Data Processing
    print("\n📊 Data Processing")
    print("-" * 30)
    tests = [
        ("openpyxl", "openpyxl"),
        ("openpyxl.styles", "openpyxl Styles"),
        ("openpyxl.chart", "openpyxl Charts"),
        ("pandas", "pandas"),
    ]
    
    for module, name in tests:
        total_count += 1
        if test_import(module, name):
            success_count += 1
    
    # Image/ML Processing
    print("\n🖼️ Image & ML Processing")
    print("-" * 30)
    tests = [
        ("PIL", "Pillow"),
        ("numpy", "NumPy"),
        ("cv2", "OpenCV"),
        ("easyocr", "EasyOCR"),
        ("google.generativeai", "Google Generative AI"),
    ]
    
    for module, name in tests:
        total_count += 1
        if test_import(module, name):
            success_count += 1
    
    # Optional Dependencies
    print("\n🔧 Optional Dependencies")
    print("-" * 30)
    tests = [
        ("weasyprint", "WeasyPrint (PDF Export)"),
        ("requests", "Requests (Testing)"),
        ("gunicorn", "Gunicorn (Production Server)"),
    ]
    
    for module, name in tests:
        total_count += 1
        if test_import(module, name):
            success_count += 1
    
    # Built-in modules (should always pass)
    print("\n🐍 Built-in Python Modules")
    print("-" * 30)
    tests = [
        ("os", "os"),
        ("json", "json"),
        ("logging", "logging"),
        ("datetime", "datetime"),
        ("functools", "functools"),
        ("tempfile", "tempfile"),
        ("random", "random"),
        ("string", "string"),
        ("base64", "base64"),
        ("io", "io"),
        ("csv", "csv"),
        ("uuid", "uuid"),
        ("smtplib", "smtplib"),
        ("email.mime.text", "email.mime.text"),
        ("email.mime.multipart", "email.mime.multipart"),
    ]
    
    for module, name in tests:
        total_count += 1
        if test_import(module, name):
            success_count += 1
    
    # Summary
    print("\n" + "=" * 60)
    print(f"📊 SUMMARY: {success_count}/{total_count} dependencies available")
    
    if success_count == total_count:
        print("🎉 All dependencies are available! Ready to run the application.")
        return True
    else:
        failed_count = total_count - success_count
        print(f"⚠️ {failed_count} dependencies are missing.")
        print("\n💡 To install missing dependencies:")
        print("   pip install -r requirements.txt")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

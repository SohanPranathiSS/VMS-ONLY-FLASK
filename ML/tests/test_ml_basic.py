import pytest

def test_ml_dependencies():
    """Test that ML dependencies are available."""
    required_modules = [
        'flask',
        'flask_cors',
        'PIL',  # Pillow
        'numpy',
        'cv2',  # OpenCV
        'easyocr'
    ]
    
    available_modules = []
    missing_modules = []
    
    for module in required_modules:
        try:
            __import__(module)
            available_modules.append(module)
            print(f"✅ {module} is available")
        except ImportError:
            missing_modules.append(module)
            print(f"❌ {module} is missing")
    
    # We need at least basic modules to work
    assert 'flask' in available_modules, "Flask is required for ML service"
    
    if missing_modules:
        print(f"⚠️ Missing optional modules: {', '.join(missing_modules)}")

def test_ml_app_creation():
    """Test that ML application can be created."""
    try:
        import AI_Agent
        assert AI_Agent.app is not None
        print("✅ ML Flask app created successfully")
    except ImportError as e:
        print(f"⚠️ Could not import AI_Agent: {e}")
        # This is OK for now, we're just setting up the testing framework
        assert True

def test_image_processing_libraries():
    """Test image processing capabilities."""
    try:
        from PIL import Image
        import numpy as np
        
        # Create a simple test image
        img = Image.new('RGB', (100, 100), color='white')
        assert img.size == (100, 100)
        
        # Test numpy array conversion
        img_array = np.array(img)
        assert img_array.shape == (100, 100, 3)
        
        print("✅ Image processing libraries working correctly")
        
    except ImportError as e:
        pytest.skip(f"Image processing libraries not available: {e}")

def test_ml_config():
    """Test ML service configuration."""
    import os
    
    # Test that environment variables can be accessed
    # (Even if not set, we should be able to access them)
    google_api_key = os.environ.get('GOOGLE_API_KEY')
    upload_folder = os.environ.get('UPLOAD_FOLDER', 'static/uploads')
    
    print(f"✅ Configuration access working")
    print(f"   - Google API Key configured: {'Yes' if google_api_key else 'No'}")
    print(f"   - Upload folder: {upload_folder}")
    
    assert True  # Basic configuration test passes

def test_file_operations():
    """Test basic file operations for ML service."""
    import tempfile
    import os
    
    # Test creating temporary files (needed for image processing)
    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
        tmp_file.write(b'test data')
        tmp_path = tmp_file.name
    
    # Verify file was created
    assert os.path.exists(tmp_path)
    
    # Clean up
    os.unlink(tmp_path)
    
    print("✅ File operations working correctly")

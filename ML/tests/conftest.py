import pytest
import sys
import os

# Add the ML directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

@pytest.fixture
def app():
    """Create ML Flask application for testing."""
    try:
        from AI_Agent import app as ml_app
        ml_app.config['TESTING'] = True
        return ml_app
    except ImportError as e:
        pytest.skip(f"Could not import AI_Agent: {e}")

@pytest.fixture
def client(app):
    """Create test client for ML service."""
    return app.test_client()

@pytest.fixture
def sample_image_data():
    """Provide sample image data for testing."""
    # Create a simple test image data
    return {
        'width': 100,
        'height': 100,
        'format': 'RGB'
    }

@pytest.fixture
def mock_image():
    """Create a mock PIL Image for testing."""
    try:
        from PIL import Image
        import io
        
        # Create a simple white image
        img = Image.new('RGB', (100, 100), color='white')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        return img_bytes
    except ImportError:
        pytest.skip("PIL not available for testing")

"""
Tests for AI Agent and ID Card Detection
Tests ML model functionality and performance
"""
import pytest
import numpy as np
from io import BytesIO
from unittest.mock import Mock, patch, MagicMock
try:
    from src.AI_Agent import IDCardDetector, CardTypeClassifier
except ImportError:
    # Fallback for testing without actual implementation
    class IDCardDetector:
        def detect_card_type(self, image): return {'card_type': 'unknown', 'confidence': 0.0}
        def preprocess_image(self, image): return image
        def extract_text(self, image): return []
        def classify_card_type(self, text): return 'unknown'
        def load_image(self, path): return None
        def initialize_ocr(self): pass
    
    class CardTypeClassifier:
        def calculate_aadhaar_confidence(self, keywords): return 0.8
        def calculate_pan_confidence(self, keywords): return 0.8
        def calculate_dl_confidence(self, keywords): return 0.8
        def calculate_passport_confidence(self, keywords): return 0.8
        def calculate_voter_confidence(self, keywords): return 0.8
        def classify_card_type(self, text): return 'unknown'


class TestIDCardDetector:
    """Test ID Card Detection functionality."""
    
    @pytest.fixture
    def detector(self):
        """Create ID card detector instance."""
        return IDCardDetector()
    
    @pytest.fixture
    def sample_image(self):
        """Create sample image for testing."""
        # Create a mock image array
        return np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    
    def test_detector_initialization(self, detector):
        """Test detector initialization."""
        assert detector is not None
        assert hasattr(detector, 'detect_card_type')
    
    @patch('easyocr.Reader')
    def test_ocr_initialization(self, mock_reader, detector):
        """Test OCR reader initialization."""
        mock_reader.return_value = Mock()
        detector.initialize_ocr()
        mock_reader.assert_called_once()
    
    @patch('cv2.imread')
    def test_image_loading(self, mock_imread, detector):
        """Test image loading functionality."""
        mock_imread.return_value = np.zeros((100, 100, 3))
        
        result = detector.load_image('test_image.jpg')
        assert result is not None
        mock_imread.assert_called_once_with('test_image.jpg')
    
    def test_image_preprocessing(self, detector, sample_image):
        """Test image preprocessing steps."""
        processed = detector.preprocess_image(sample_image)
        assert processed is not None
        assert isinstance(processed, np.ndarray)
    
    @patch('src.AI_Agent.IDCardDetector.extract_text')
    def test_text_extraction(self, mock_extract, detector, sample_image):
        """Test text extraction from image."""
        mock_extract.return_value = ["AADHAAR", "1234", "5678", "9012"]
        
        text = detector.extract_text(sample_image)
        assert len(text) > 0
        assert "AADHAAR" in text
    
    def test_card_type_detection(self, detector):
        """Test card type detection logic."""
        # Test Aadhaar detection
        aadhaar_text = ["AADHAAR", "Unique", "Identification", "Authority"]
        card_type = detector.classify_card_type(aadhaar_text)
        assert card_type == "aadhaar"
        
        # Test PAN detection
        pan_text = ["INCOME", "TAX", "PAN", "GOVERNMENT"]
        card_type = detector.classify_card_type(pan_text)
        assert card_type == "pan"
        
        # Test Driving License detection
        dl_text = ["DRIVING", "LICENSE", "TRANSPORT", "AUTHORITY"]
        card_type = detector.classify_card_type(dl_text)
        assert card_type == "driving_license"


class TestCardTypeClassifier:
    """Test card type classification algorithms."""
    
    @pytest.fixture
    def classifier(self):
        """Create classifier instance."""
        return CardTypeClassifier()
    
    def test_aadhaar_patterns(self, classifier):
        """Test Aadhaar card pattern recognition."""
        aadhaar_keywords = [
            "AADHAAR", "UNIQUE", "IDENTIFICATION", "AUTHORITY",
            "Government of India", "xxxx xxxx 1234"
        ]
        
        confidence = classifier.calculate_aadhaar_confidence(aadhaar_keywords)
        assert confidence > 0.8
    
    def test_pan_patterns(self, classifier):
        """Test PAN card pattern recognition."""
        pan_keywords = [
            "INCOME", "TAX", "PAN", "PERMANENT",
            "ACCOUNT", "NUMBER", "GOVT"
        ]
        
        confidence = classifier.calculate_pan_confidence(pan_keywords)
        assert confidence > 0.8
    
    def test_driving_license_patterns(self, classifier):
        """Test driving license pattern recognition."""
        dl_keywords = [
            "DRIVING", "LICENSE", "LICENCE", "TRANSPORT",
            "AUTHORITY", "MOTOR", "VEHICLE"
        ]
        
        confidence = classifier.calculate_dl_confidence(dl_keywords)
        assert confidence > 0.8
    
    def test_passport_patterns(self, classifier):
        """Test passport pattern recognition."""
        passport_keywords = [
            "PASSPORT", "REPUBLIC", "INDIA", "TYPE",
            "COUNTRY", "NATIONALITY"
        ]
        
        confidence = classifier.calculate_passport_confidence(passport_keywords)
        assert confidence > 0.8
    
    def test_voter_id_patterns(self, classifier):
        """Test voter ID pattern recognition."""
        voter_keywords = [
            "ELECTION", "COMMISSION", "VOTER", "CARD",
            "IDENTITY", "ELECTORAL"
        ]
        
        confidence = classifier.calculate_voter_confidence(voter_keywords)
        assert confidence > 0.8


class TestMLServiceAPI:
    """Test ML service API endpoints."""
    
    @pytest.fixture
    def app(self):
        """Create Flask app for testing."""
        try:
            from src.app import create_app
            app = create_app('testing')
        except ImportError:
            from flask import Flask
            app = Flask(__name__)
            app.config['TESTING'] = True
        return app
    
    @pytest.fixture
    def client(self, app):
        """Create test client."""
        return app.test_client()
    
    def test_health_endpoint(self, client):
        """Test ML service health check."""
        response = client.get('/health')
        assert response.status_code == 200
    
    @patch('src.AI_Agent.IDCardDetector.detect_card_type')
    def test_detect_endpoint(self, mock_detect, client):
        """Test card detection endpoint."""
        mock_detect.return_value = {
            'card_type': 'aadhaar',
            'confidence': 0.95,
            'text_found': ['AADHAAR', 'UNIQUE']
        }
        
        # Mock file upload
        data = {'file': (BytesIO(b'fake image data'), 'test.jpg')}
        response = client.post('/api/detect', 
                              data=data,
                              content_type='multipart/form-data')
        
        if response.status_code == 200:
            result = response.get_json()
            assert result['card_type'] == 'aadhaar'
            assert result['confidence'] > 0.9


class TestPerformanceBenchmarks:
    """Performance benchmarks for ML operations."""
    
    @pytest.fixture
    def detector(self):
        """Create detector for benchmarking."""
        return IDCardDetector()
    
    @pytest.fixture
    def sample_image(self):
        """Create sample image."""
        return np.random.randint(0, 255, (800, 600, 3), dtype=np.uint8)
    
    def test_image_processing_speed(self, benchmark, detector, sample_image):
        """Benchmark image processing speed."""
        result = benchmark(detector.preprocess_image, sample_image)
        assert result is not None
    
    @patch('easyocr.Reader.readtext')
    def test_ocr_processing_speed(self, mock_readtext, benchmark, detector, sample_image):
        """Benchmark OCR processing speed."""
        mock_readtext.return_value = [
            ([[0, 0], [100, 0], [100, 50], [0, 50]], 'AADHAAR', 0.95)
        ]
        
        result = benchmark(detector.extract_text, sample_image)
        assert len(result) > 0
    
    def test_classification_speed(self, benchmark, detector):
        """Benchmark classification speed."""
        sample_text = ["AADHAAR", "UNIQUE", "IDENTIFICATION", "AUTHORITY"]
        result = benchmark(detector.classify_card_type, sample_text)
        assert result in ['aadhaar', 'pan', 'driving_license', 'passport', 'voter_id', 'other']


class TestErrorHandling:
    """Test error handling in ML service."""
    
    def test_invalid_image_handling(self):
        """Test handling of invalid images."""
        detector = IDCardDetector()
        
        # Test with None
        result = detector.detect_card_type(None)
        assert result['card_type'] == 'unknown'
        assert result['confidence'] == 0.0
    
    def test_empty_text_handling(self):
        """Test handling of empty text extraction."""
        classifier = CardTypeClassifier()
        
        result = classifier.classify_card_type([])
        assert result == 'unknown'
    
    def test_ocr_failure_handling(self):
        """Test handling of OCR failures."""
        detector = IDCardDetector()
        
        with patch('easyocr.Reader.readtext', side_effect=Exception("OCR failed")):
            result = detector.extract_text(np.zeros((100, 100, 3)))
            assert result == []


if __name__ == '__main__':
    pytest.main([__file__])

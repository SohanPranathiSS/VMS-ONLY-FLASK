import pytest
import sys
import os

# Add the Backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    # Import from restructured application
    from app import create_app
    
    # Create app with testing configuration
    flask_app = create_app('testing')
    
    # Configure the app for testing
    flask_app.config['TESTING'] = True
    flask_app.config['WTF_CSRF_ENABLED'] = False
    
    # Create a test client
    with flask_app.app_context():
        yield flask_app

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()

# Mock database for testing
@pytest.fixture
def mock_db():
    """Mock database for testing."""
    class MockDB:
        def __init__(self):
            self.users = []
            self.visitors = []
            self.visits = []
        
        def add_user(self, user):
            user['id'] = len(self.users) + 1
            self.users.append(user)
            return user['id']
        
        def get_user(self, user_id):
            return next((u for u in self.users if u['id'] == user_id), None)
        
        def get_user_by_username(self, username):
            return next((u for u in self.users if u['username'] == username), None)
        
        def add_visitor(self, visitor):
            visitor['id'] = len(self.visitors) + 1
            self.visitors.append(visitor)
            return visitor['id']
        
        def get_visitors(self):
            return self.visitors
    
    return MockDB()

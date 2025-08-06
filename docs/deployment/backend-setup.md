# Backend Setup Instructions

## Prerequisites
- Python 3.8 or higher
- MySQL database server
- Virtual environment (recommended)

## Installation Steps

### 1. Create and Activate Virtual Environment
```bash
# Create virtual environment
python -m venv vms_env

# Activate virtual environment
# On Windows:
vms_env\Scripts\activate
# On macOS/Linux:
source vms_env/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
Create a `.env` file in the Backend directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=vms_db

# JWT Secret Key
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (for verification emails)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password

# Admin Email (for notifications)
ADMIN_EMAIL=admin@yourcompany.com

# Google AI API Key (for ML features)
GOOGLE_API_KEY=your-google-ai-api-key
```

### 4. Database Setup
1. Create MySQL database named `vms_db`
2. Run the SQL schema file to create tables
3. Ensure MySQL server is running

### 5. Optional: WeasyPrint Installation
If you want PDF export functionality, uncomment the weasyprint line in requirements.txt and install system dependencies:

**Windows:**
```bash
pip install weasyprint
```

**Ubuntu/Debian:**
```bash
sudo apt-get install build-essential python3-dev python3-pip python3-setuptools python3-wheel python3-cffi libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf2.0-0 libffi-dev shared-mime-info
pip install weasyprint
```

**macOS:**
```bash
brew install cairo pango gdk-pixbuf libffi
pip install weasyprint
```

### 6. Run the Application
```bash
# Development mode
python app.py

# Production mode with Gunicorn
gunicorn -w 4 -b 0.0.0.0:4000 app:app
```

## Dependency Breakdown

### Core Flask Framework
- **Flask**: Web framework
- **flask-cors**: Cross-origin resource sharing
- **Werkzeug**: WSGI utilities

### Authentication & Security
- **PyJWT**: JSON Web Token handling
- **python-dotenv**: Environment variable management

### Database
- **mysql-connector-python**: MySQL database connectivity

### Data Processing
- **openpyxl**: Excel file generation and manipulation
- **pandas**: Data analysis and manipulation

### Image/Document Processing (ML Features)
- **Pillow**: Python Imaging Library
- **numpy**: Numerical computing
- **opencv-python-headless**: Computer vision (headless version for servers)
- **easyocr**: Optical Character Recognition

### AI Integration
- **google-generativeai**: Google AI services integration

### Production Deployment
- **gunicorn**: Python WSGI HTTP Server

### Optional Dependencies
- **weasyprint**: PDF generation (requires system dependencies)
- **requests**: HTTP library (for testing)

## Troubleshooting

### Common Issues

1. **MySQL Connection Error**
   - Ensure MySQL server is running
   - Check database credentials in .env file
   - Verify database exists

2. **WeasyPrint Installation Issues**
   - Install system dependencies first
   - On Windows, consider using WSL for easier installation

3. **EasyOCR Installation Issues**
   - Requires significant disk space (~1GB)
   - May need to install with `--no-deps` flag if dependency conflicts occur

4. **Google AI API Issues**
   - Ensure valid API key is set in .env file
   - Check API quotas and limits

### Performance Notes

- EasyOCR downloads models on first use (~500MB-1GB)
- Consider using a separate ML service in production
- Use gunicorn with multiple workers for production deployment

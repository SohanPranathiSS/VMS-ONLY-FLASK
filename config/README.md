# 🔧 Environment Configuration Management
# Centralized environment variable templates and validation

## 📁 Structure Overview

This directory contains centralized environment configuration templates for all services in the Visitor Management System.

### 🗂️ Files Structure
```
📁 config/
├── .env.template           # Master template with all variables
├── .env.development        # Development environment settings
├── .env.production         # Production environment settings
├── .env.testing            # Testing environment settings
├── frontend.env.template   # Frontend-specific variables
├── backend.env.template    # Backend-specific variables
├── ml.env.template         # ML service-specific variables
├── validate-env.js         # Environment validation script
└── README.md              # This file
```

## 🎯 Usage Instructions

### 1. **Development Setup**
```bash
# Copy master template for local development
cp config/.env.development .env

# Service-specific setup
cp config/frontend.env.template Frontend/.env
cp config/backend.env.template Backend/.env
cp config/ml.env.template ML/.env
```

### 2. **Production Deployment**
```bash
# Copy production template
cp config/.env.production .env

# Update with production values
nano .env
```

### 3. **Environment Validation**
```bash
# Validate all environment variables
node config/validate-env.js

# Check specific service
node config/validate-env.js --service=backend
```

## 🔐 Security Guidelines

1. **Never commit actual .env files** - Only templates
2. **Use strong, unique keys** for production
3. **Rotate secrets regularly** in production
4. **Limit access** to production environment files
5. **Use environment-specific databases** 

## 📝 Environment Variables Reference

### 🌐 **Global Variables**
- `NODE_ENV` - Environment mode (development/production/test)
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
- `TZ` - Timezone setting

### 🗄️ **Database Configuration**
- `DB_HOST` - Database host
- `DB_PORT` - Database port  
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password

### 🔒 **Security Configuration**
- `JWT_SECRET` - JWT signing secret
- `SECRET_KEY` - Flask secret key
- `ALLOWED_HOSTS` - Allowed host domains
- `CORS_ORIGINS` - CORS allowed origins

### 🌐 **Service URLs**
- `FRONTEND_URL` - Frontend application URL
- `BACKEND_URL` - Backend API URL
- `ML_SERVICE_URL` - ML service URL

### 📧 **Email Configuration**
- `EMAIL_HOST` - SMTP server host
- `EMAIL_PORT` - SMTP server port
- `EMAIL_USER` - SMTP username
- `EMAIL_PASS` - SMTP password/app password

### 🤖 **AI/ML Configuration**
- `GOOGLE_API_KEY` - Google Gemini AI API key
- `OPENAI_API_KEY` - OpenAI API key (if used)

## 🔄 Environment Hierarchy

1. **System Environment Variables** (highest priority)
2. **Service-specific .env files** 
3. **Global .env file**
4. **Default values in code** (lowest priority)

## 🧪 Testing Environments

### Development
- Uses local database
- Debug mode enabled
- Relaxed CORS policy
- Detailed logging

### Production  
- Production database
- Debug mode disabled
- Strict CORS policy
- Error logging only
- SSL/HTTPS enabled

### Testing
- In-memory/test database
- Mock external services
- Fast test execution
- Detailed test logging

---

**Last Updated:** August 5, 2025  
**Maintainer:** Development Team  

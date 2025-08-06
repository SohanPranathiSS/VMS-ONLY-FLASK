# 🔧 Environment Configuration Migration Guide

## 📋 Overview
This guide helps you migrate from the old scattered environment configuration to the new centralized environment management system.

## 🔄 Migration Steps

### 1. **Backup Existing Environment Files**
```bash
# Create backup directory
mkdir -p backup/env-files

# Backup existing files
cp .env.production.example backup/env-files/ 2>/dev/null || true
cp Backend/.env.example backup/env-files/backend.env.example 2>/dev/null || true
cp ML/.env.example backup/env-files/ml.env.example 2>/dev/null || true
cp Frontend/.env backup/env-files/frontend.env 2>/dev/null || true

echo "✅ Existing environment files backed up"
```

### 2. **Set Up New Centralized Configuration**
```bash
# Use the automated setup script
npm run setup:env:dev

# Or manually for specific environment
npm run setup:env:prod
npm run setup:env:test
```

### 3. **Migrate Existing Values**

#### **From old Backend/.env.example → new Backend/.env**
```bash
# Old location: Backend/.env.example
# New location: Backend/.env (generated from config/backend.env.template)

# Key mappings:
FLASK_HOST → FLASK_HOST (same)
FLASK_PORT → FLASK_PORT (same)
DB_HOST → DB_HOST (same)
DB_USER → DB_USER (same)
DB_PASSWORD → DB_PASSWORD (same)
JWT_SECRET → JWT_SECRET (same)
SECRET_KEY → SECRET_KEY (same)
UPLOAD_FOLDER → UPLOAD_FOLDER (same)
ML_SERVICE_URL → ML_SERVICE_URL (same)
EMAIL_USER → EMAIL_USER (same)
EMAIL_PASS → EMAIL_PASS (same)
```

#### **From old ML/.env.example → new ML/.env**
```bash
# Old location: ML/.env.example
# New location: ML/.env (generated from config/ml.env.template)

# Key mappings:
ML_HOST → ML_HOST (same)
ML_PORT → ML_PORT (same)
PORT → PORT (same)
GOOGLE_API_KEY → GOOGLE_API_KEY (same)
UPLOAD_FOLDER → UPLOAD_FOLDER (same)
ALLOWED_ORIGINS → ALLOWED_ORIGINS (same)
```

#### **From old Frontend/.env → new Frontend/.env**
```bash
# Old location: Frontend/.env
# New location: Frontend/.env (generated from config/frontend.env.template)

# Key mappings:
REACT_APP_API_BASE_URL → REACT_APP_API_BASE_URL (same)
REACT_APP_ML_SERVICE_URL → REACT_APP_ML_SERVICE_URL (same)
```

### 4. **Automated Migration Script**
```bash
#!/bin/bash
# Run this script to automatically migrate values

echo "🔄 Starting environment migration..."

# Function to extract value from old env file
extract_env_value() {
    local file="$1"
    local key="$2"
    if [ -f "$file" ]; then
        grep "^$key=" "$file" | cut -d'=' -f2- | sed 's/^["'\'']//' | sed 's/["'\'']$//'
    fi
}

# Function to update value in new env file
update_env_value() {
    local file="$1"
    local key="$2"
    local value="$3"
    if [ -f "$file" ] && [ -n "$value" ]; then
        if grep -q "^$key=" "$file"; then
            sed -i "s|^$key=.*|$key=$value|" "$file"
            echo "✅ Updated $key in $file"
        fi
    fi
}

# Migrate Backend configuration
if [ -f "Backend/.env.example" ]; then
    echo "📁 Migrating Backend configuration..."
    
    FLASK_PORT=$(extract_env_value "Backend/.env.example" "FLASK_PORT")
    DB_PASSWORD=$(extract_env_value "Backend/.env.example" "DB_PASSWORD")
    JWT_SECRET=$(extract_env_value "Backend/.env.example" "JWT_SECRET")
    EMAIL_USER=$(extract_env_value "Backend/.env.example" "EMAIL_USER")
    EMAIL_PASS=$(extract_env_value "Backend/.env.example" "EMAIL_PASS")
    
    update_env_value "Backend/.env" "FLASK_PORT" "$FLASK_PORT"
    update_env_value "Backend/.env" "DB_PASSWORD" "$DB_PASSWORD"
    update_env_value "Backend/.env" "JWT_SECRET" "$JWT_SECRET"
    update_env_value "Backend/.env" "EMAIL_USER" "$EMAIL_USER"
    update_env_value "Backend/.env" "EMAIL_PASS" "$EMAIL_PASS"
fi

# Migrate ML configuration
if [ -f "ML/.env.example" ]; then
    echo "📁 Migrating ML configuration..."
    
    GOOGLE_API_KEY=$(extract_env_value "ML/.env.example" "GOOGLE_API_KEY")
    ML_PORT=$(extract_env_value "ML/.env.example" "ML_PORT")
    
    update_env_value "ML/.env" "GOOGLE_API_KEY" "$GOOGLE_API_KEY"
    update_env_value "ML/.env" "ML_PORT" "$ML_PORT"
fi

# Migrate Frontend configuration
if [ -f "Frontend/.env" ]; then
    echo "📁 Frontend configuration already exists - keeping current values"
fi

echo "✅ Migration completed!"
echo "🔍 Run validation: npm run validate:env"
```

### 5. **Validate New Configuration**
```bash
# Validate all services
npm run validate:env

# Validate specific services
npm run validate:env:backend
npm run validate:env:frontend
npm run validate:env:ml
```

## 📂 New Directory Structure

### **Before (Scattered)**
```
📁 Root/
├── .env.production.example   # Production template
├── 📁 Backend/
│   └── .env.example         # Backend template
├── 📁 Frontend/
│   └── .env                 # Frontend config
└── 📁 ML/
    └── .env.example         # ML template
```

### **After (Centralized)**
```
📁 Root/
├── .env                     # Global environment (generated)
├── 📁 config/              # NEW - Centralized configuration
│   ├── README.md           # Configuration documentation
│   ├── .env.template       # Master template
│   ├── .env.development    # Development environment
│   ├── .env.production     # Production environment
│   ├── .env.testing        # Testing environment
│   ├── frontend.env.template
│   ├── backend.env.template
│   ├── ml.env.template
│   ├── validate-env.js     # Validation script
│   └── setup-env.sh        # Setup automation
├── 📁 Backend/
│   └── .env                # Generated from template
├── 📁 Frontend/
│   └── .env                # Generated from template
└── 📁 ML/
    └── .env                # Generated from template
```

## 🎯 Benefits of New System

### **1. Centralized Management**
- All environment templates in one location
- Consistent variable naming across services
- Easy to maintain and update

### **2. Environment-Specific Configurations**
- Dedicated files for development, production, testing
- Environment-specific optimizations
- Clear separation of concerns

### **3. Automated Validation**
- Script to validate required variables
- Security pattern checking
- Environment consistency verification

### **4. Developer Experience**
- Simple setup commands (`npm run setup:env:dev`)
- Clear documentation and templates
- Automated migration from old structure

### **5. Security Improvements**
- Secure file permissions (600)
- Template-based approach prevents accidental secret commits
- Security validation patterns

## 🔧 Common Migration Issues

### **Issue 1: Port Conflicts**
```bash
# Old configuration might have different ports
# New system standardizes: Frontend:3000, Backend:4000, ML:5000

# Solution: Update any hardcoded references
grep -r "localhost:8000" . --exclude-dir=node_modules
# Replace with appropriate new ports
```

### **Issue 2: Missing Environment Variables**
```bash
# Some variables might be missing in old files
# Solution: Use validation script to identify missing vars
npm run validate:env
```

### **Issue 3: Secret Key Formats**
```bash
# Old secrets might not meet new security standards
# Solution: Generate new strong secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📝 Post-Migration Checklist

- [ ] All old environment files backed up
- [ ] New centralized configuration set up
- [ ] Values migrated from old files
- [ ] Environment validation passes
- [ ] Services start successfully with new configuration
- [ ] Database connections work
- [ ] API keys and external services function
- [ ] Email configuration tested (if used)
- [ ] File upload directories exist and are writable
- [ ] Production secrets updated (if migrating production)

## 🆘 Rollback Procedure

If migration causes issues:

```bash
# 1. Restore old files
cp backup/env-files/* . 2>/dev/null || true
cp backup/env-files/backend.env.example Backend/.env.example 2>/dev/null || true
cp backup/env-files/ml.env.example ML/.env.example 2>/dev/null || true

# 2. Remove new files
rm -f .env Backend/.env ML/.env

# 3. Test services
npm run start:backend
npm run start:ml
npm run start:frontend
```

## 🎉 Success Verification

After migration:

```bash
# 1. Validate configuration
npm run validate:env

# 2. Start all services
npm run dev

# 3. Test API endpoints
curl http://localhost:4000/api/health
curl http://localhost:5000/health

# 4. Test Frontend
open http://localhost:3000
```

---

**Migration completed successfully!** 🚀

Your environment configuration is now centralized, validated, and ready for scalable development and deployment.

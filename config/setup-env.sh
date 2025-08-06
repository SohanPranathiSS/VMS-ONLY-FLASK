#!/bin/bash
# =============================================================================
# Environment Setup Script for Visitor Management System
# =============================================================================
# This script automates the setup of environment files for different environments
# Usage: ./setup-env.sh [development|production|testing]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Default environment
ENVIRONMENT=${1:-development}

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${MAGENTA}${BOLD}🔧 Visitor Management System - Environment Setup${NC}"
echo -e "${CYAN}Environment: ${ENVIRONMENT}${NC}"
echo -e "${CYAN}Project Root: ${PROJECT_ROOT}${NC}"
echo "============================================================"

# Validate environment parameter
case $ENVIRONMENT in
    development|production|testing)
        echo -e "${GREEN}✅ Valid environment: ${ENVIRONMENT}${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid environment: ${ENVIRONMENT}${NC}"
        echo -e "${YELLOW}Available environments: development, production, testing${NC}"
        exit 1
        ;;
esac

# Function to copy and setup environment file
setup_env_file() {
    local source_file="$1"
    local target_file="$2"
    local service_name="$3"
    
    echo -e "\n${BLUE}📁 Setting up ${service_name} environment...${NC}"
    
    if [ -f "$target_file" ]; then
        echo -e "${YELLOW}⚠️  ${target_file} already exists${NC}"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}⏭️  Skipping ${service_name}${NC}"
            return
        fi
        # Backup existing file
        cp "$target_file" "${target_file}.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "${GREEN}💾 Created backup of existing file${NC}"
    fi
    
    # Copy template
    cp "$source_file" "$target_file"
    echo -e "${GREEN}✅ Copied ${source_file} → ${target_file}${NC}"
    
    # Make file readable only by owner if it contains secrets
    if [[ "$target_file" == *".env"* ]]; then
        chmod 600 "$target_file"
        echo -e "${GREEN}🔒 Set secure permissions (600)${NC}"
    fi
}

# Create necessary directories
echo -e "\n${BLUE}📁 Creating directories...${NC}"
mkdir -p "$PROJECT_ROOT/Frontend"
mkdir -p "$PROJECT_ROOT/Backend"
mkdir -p "$PROJECT_ROOT/ML"
mkdir -p "$PROJECT_ROOT/logs"
mkdir -p "$PROJECT_ROOT/uploads"
echo -e "${GREEN}✅ Directories created${NC}"

# Setup global environment
echo -e "\n${MAGENTA}${BOLD}🌐 Setting up global environment${NC}"
setup_env_file \
    "$SCRIPT_DIR/.env.${ENVIRONMENT}" \
    "$PROJECT_ROOT/.env" \
    "Global"

# Setup service-specific environments
echo -e "\n${MAGENTA}${BOLD}🎯 Setting up service environments${NC}"

# Frontend
setup_env_file \
    "$SCRIPT_DIR/frontend.env.template" \
    "$PROJECT_ROOT/Frontend/.env" \
    "Frontend"

# Backend
setup_env_file \
    "$SCRIPT_DIR/backend.env.template" \
    "$PROJECT_ROOT/Backend/.env" \
    "Backend"

# ML Service
setup_env_file \
    "$SCRIPT_DIR/ml.env.template" \
    "$PROJECT_ROOT/ML/.env" \
    "ML Service"

# Create .env.local files for local overrides
echo -e "\n${BLUE}📝 Creating local override templates...${NC}"

# Frontend .env.local
cat > "$PROJECT_ROOT/Frontend/.env.local.template" << EOF
# Local development overrides for Frontend
# Copy this to .env.local and customize
# This file should NOT be committed to version control

# Development API endpoints (if different from .env)
# REACT_APP_API_BASE_URL=http://localhost:4000/api
# REACT_APP_ML_SERVICE_URL=http://localhost:5000

# Local feature flags
# REACT_APP_DEBUG=true
# REACT_APP_ENABLE_MOCK_DATA=true
EOF

echo -e "${GREEN}✅ Created Frontend/.env.local.template${NC}"

# Backend .env.local
cat > "$PROJECT_ROOT/Backend/.env.local.template" << EOF
# Local development overrides for Backend
# Copy this to .env.local and customize
# This file should NOT be committed to version control

# Local database (if different from .env)
# DB_HOST=localhost
# DB_USER=local_user
# DB_PASSWORD=local_password

# Local secrets (for development only)
# JWT_SECRET=local_jwt_secret_for_development
# SECRET_KEY=local_secret_key_for_development
EOF

echo -e "${GREEN}✅ Created Backend/.env.local.template${NC}"

# Update .gitignore to exclude actual .env files
echo -e "\n${BLUE}🔒 Updating .gitignore...${NC}"
GITIGNORE="$PROJECT_ROOT/.gitignore"

# Add .env patterns to .gitignore if not already present
if [ -f "$GITIGNORE" ]; then
    if ! grep -q "# Environment files" "$GITIGNORE"; then
        cat >> "$GITIGNORE" << EOF

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
Frontend/.env
Frontend/.env.local
Backend/.env
Backend/.env.local
ML/.env
ML/.env.local
*.env.backup.*
EOF
        echo -e "${GREEN}✅ Updated .gitignore with environment file patterns${NC}"
    else
        echo -e "${YELLOW}⚠️  .gitignore already contains environment file patterns${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .gitignore not found, skipping update${NC}"
fi

# Environment-specific setup instructions
echo -e "\n${MAGENTA}${BOLD}📋 Environment-specific setup instructions${NC}"

case $ENVIRONMENT in
    development)
        echo -e "${CYAN}🔧 Development Environment Setup:${NC}"
        echo "1. Update database credentials in Backend/.env"
        echo "2. Add your Google API key in ML/.env"
        echo "3. Configure email settings in Backend/.env (optional for dev)"
        echo "4. Run: npm run validate-env (to validate configuration)"
        ;;
    production)
        echo -e "${RED}🚨 Production Environment Setup:${NC}"
        echo "1. ${BOLD}IMMEDIATELY${NC} change all passwords and secret keys"
        echo "2. Update domain names in all .env files"
        echo "3. Configure production database credentials"
        echo "4. Set up SSL certificates"
        echo "5. Configure production email SMTP"
        echo "6. Add production Google API key"
        echo "7. Set up error monitoring (Sentry)"
        echo "8. Run: npm run validate-env (to validate configuration)"
        echo ""
        echo -e "${RED}⚠️  SECURITY WARNING: Review all files before deployment!${NC}"
        ;;
    testing)
        echo -e "${BLUE}🧪 Testing Environment Setup:${NC}"
        echo "1. Configure test database"
        echo "2. Set up mock services if needed"
        echo "3. Verify all test configurations"
        echo "4. Run: npm run validate-env (to validate configuration)"
        ;;
esac

# Final validation
echo -e "\n${MAGENTA}${BOLD}🔍 Running environment validation...${NC}"
if command -v node &> /dev/null; then
    if [ -f "$SCRIPT_DIR/validate-env.js" ]; then
        node "$SCRIPT_DIR/validate-env.js"
    else
        echo -e "${YELLOW}⚠️  Validation script not found, skipping validation${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Node.js not found, skipping validation${NC}"
fi

# Success message
echo -e "\n${GREEN}${BOLD}🎉 Environment setup completed successfully!${NC}"
echo -e "${CYAN}Next steps:${NC}"
echo "1. Review and customize the generated .env files"
echo "2. Add your actual API keys and passwords"
echo "3. Run the validation script: node config/validate-env.js"
echo "4. Start your services to test the configuration"

echo -e "\n${BLUE}💡 Useful commands:${NC}"
echo "• Validate environment: npm run validate-env"
echo "• Validate specific service: npm run validate-env -- --service=backend"
echo "• Re-run setup: ./config/setup-env.sh ${ENVIRONMENT}"

echo -e "\n${YELLOW}🔒 Security reminders:${NC}"
echo "• Never commit actual .env files to version control"
echo "• Use strong, unique passwords for production"
echo "• Regularly rotate API keys and secrets"
echo "• Review file permissions (should be 600 for .env files)"

echo -e "\n${GREEN}Setup complete! Happy coding! 🚀${NC}"

# 🚀 Quick Setup Guide - Updated Package Management

## **New Developer Setup (Post Package Management Fix)**

### **Prerequisites:**
- Node.js >= 16.0.0
- npm >= 8.0.0
- Python 3.11+
- MySQL 8.0+

### **1. Clone & Setup:**
```bash
git clone https://github.com/SohanPranathiSS/visitor-management-system-Version-3.git
cd visitor-management-system-Version-3

# Install all dependencies with one command
npm run install:all
```

### **2. Environment Configuration:**
```bash
# Copy environment templates
cp Backend/.env.example Backend/.env
cp Frontend/.env Frontend/.env

# Edit the .env files with your configurations
```

### **3. Database Setup:**
```bash
# Create database
mysql -u root -p < database/init.sql
```

### **4. Start Development:**
```bash
# Option 1: Start both frontend and backend together
npm run dev

# Option 2: Start individually
npm run start:backend
npm run start:frontend
```

### **5. Available Commands:**

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install all dependencies |
| `npm run dev` | Start both frontend and backend |
| `npm run start:frontend` | Start React development server |
| `npm run start:backend` | Start Flask backend server |
| `npm run build:frontend` | Build frontend for production |
| `npm run test:all` | Run all tests with coverage |
| `npm run docker:build` | Build Docker images |
| `npm run docker:up` | Start all services with Docker |
| `npm run docker:down` | Stop Docker services |
| `npm run clean` | Clean and reinstall frontend deps |

### **6. Verify Setup:**
```bash
# Check if all services are running
curl http://localhost:3000  # Frontend
curl http://localhost:5000  # Backend API
curl http://localhost:5002  # ML Service
```

---

## **What Changed:**

### **Before (Problematic):**
```bash
# Had to manually install in each directory
cd Frontend && npm install
cd ../Backend && pip install -r requirements.txt
cd ../ML && pip install -r requirements.txt

# No centralized scripts
# Version conflicts between root and Frontend
# Confusing dependency management
```

### **After (Streamlined):**
```bash
# One command installs everything
npm run install:all

# Centralized operations
npm run dev  # Starts everything
npm run test:all  # Tests everything
npm run docker:up  # Deploys everything

# Clean dependency management
# No version conflicts
# Proper workspace structure
```

---

## **Troubleshooting:**

### **If npm run install:all fails:**
```bash
# Check Node.js version
node --version  # Should be >= 16.0.0

# Clear npm cache
npm cache clean --force

# Manual installation
npm install
cd Frontend && npm install
```

### **If dev command doesn't start backend:**
```bash
# Ensure Python is in PATH
python --version

# Install backend dependencies manually
cd Backend
pip install -r requirements.txt
python run.py
```

### **If ports are in use:**
```bash
# Check what's using the ports
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Kill processes or change ports in environment files
```

---

**Quick Start Time: ~5 minutes** ⚡

The new package management setup significantly reduces setup time and eliminates common configuration issues!

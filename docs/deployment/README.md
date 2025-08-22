# Deployment Documentation

## Overview
This directory contains deployment guides and configuration for the Visitor Management System.

## Deployment Methods

### Local Development
1. **Backend Setup**
   ```bash
   cd Backend
   pip install -r requirements.txt
   python run.py
   ```

2. **Frontend Setup**
   ```bash
   cd Frontend
   npm install
   npm start
   ```

3. **ML Service Setup**
   ```bash
   cd ML
   pip install -r requirements.txt
   python AI_Agent.py
   ```

### Production Deployment

#### Using Docker (Recommended)
```bash
# Build and run all services
docker-compose up --build

# Scale services
docker-compose up --scale backend=3 --scale ml=2
```

#### Manual Deployment
1. **Database Setup**
   - MySQL 8.0+ required
   - Create database: `visitor_management`
   - Run migration scripts

2. **Environment Configuration**
   - Copy `.env.production` to `.env`
   - Update database credentials
   - Configure SMTP settings
   - Set up Google AI API key

3. **Service Deployment**
   - Backend: Deploy to server with Python 3.9+
   - Frontend: Build and serve with nginx
   - ML Service: Deploy separately for scalability

## Environment Variables
- `SECRET_KEY` - Flask secret key
- `JWT_SECRET` - JWT signing secret
- `MYSQL_HOST` - Database host
- `MYSQL_USER` - Database username
- `MYSQL_PASSWORD` - Database password
- `MYSQL_DATABASE` - Database name
- `GOOGLE_API_KEY` - Google AI API key
- `SMTP_*` - Email configuration

## Security Checklist
- [ ] Change default passwords
- [ ] Configure HTTPS
- [ ] Set up rate limiting
- [ ] Configure firewall rules
- [ ] Enable security headers
- [ ] Set up monitoring

## Monitoring
- Application logs: `/var/log/visitor-management/`
- Performance metrics: Prometheus + Grafana
- Error tracking: Sentry integration
- Health checks: `/health` endpoints

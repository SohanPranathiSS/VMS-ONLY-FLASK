# Security Configuration and Hardening Guide

## 🔒 Production Security Checklist

### ✅ Application Security
- [ ] **Environment Variables**: All secrets stored in environment variables
- [ ] **Input Validation**: Server-side validation for all user inputs
- [ ] **SQL Injection Protection**: Parameterized queries and ORM usage
- [ ] **XSS Protection**: Content Security Policy and output encoding
- [ ] **CSRF Protection**: CSRF tokens implemented
- [ ] **Authentication**: Strong password policies and JWT implementation
- [ ] **Authorization**: Role-based access control (RBAC)
- [ ] **Session Security**: Secure session configuration with Redis

### ✅ Infrastructure Security
- [ ] **SSL/TLS**: HTTPS enabled with strong cipher suites
- [ ] **Security Headers**: Comprehensive HTTP security headers
- [ ] **Rate Limiting**: API and application rate limiting
- [ ] **Network Isolation**: Container network segmentation
- [ ] **Non-Root Containers**: All containers run as non-root users
- [ ] **Secret Management**: Proper secret handling and rotation
- [ ] **Database Security**: Secure database configuration
- [ ] **Backup Encryption**: Encrypted backup storage

### ✅ Monitoring & Logging
- [ ] **Access Logging**: Comprehensive access log collection
- [ ] **Error Monitoring**: Centralized error tracking
- [ ] **Security Monitoring**: Failed login and suspicious activity tracking
- [ ] **Health Monitoring**: Service health and performance monitoring
- [ ] **Audit Logging**: User activity and system change logging

## 🛡️ Security Implementation Details

### 1. SSL/TLS Configuration

#### Strong Cipher Suites
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
ssl_prefer_server_ciphers off;
```

#### Certificate Validation
```bash
# Verify certificate strength
openssl x509 -in ssl/server.crt -text -noout | grep "Public Key"
# Should show: RSA Public Key: (2048 bit) or higher
```

### 2. HTTP Security Headers

#### Implemented Headers
```nginx
# Strict Transport Security
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Content Type Options
add_header X-Content-Type-Options "nosniff" always;

# Frame Options
add_header X-Frame-Options "DENY" always;

# XSS Protection
add_header X-XSS-Protection "1; mode=block" always;

# Referrer Policy
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self';" always;
```

### 3. Rate Limiting Configuration

#### API Rate Limits
```python
# Flask-Limiter configuration
RATELIMIT_STORAGE_URL = "redis://redis:6379/1"
RATELIMIT_DEFAULT = "1000 per hour"

# Specific endpoint limits
@limiter.limit("5 per minute")
def login():
    pass

@limiter.limit("100 per hour")
def api_endpoint():
    pass
```

#### Nginx Rate Limiting
```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general:10m rate=1r/s;

# Apply limits
location /api/auth/login {
    limit_req zone=login burst=3 nodelay;
}

location /api/ {
    limit_req zone=api burst=20 nodelay;
}
```

### 4. Database Security

#### MySQL Security Configuration
```sql
-- Create secure user with limited privileges
CREATE USER 'vms_user'@'%' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON visitor_management_prod.* TO 'vms_user'@'%';
FLUSH PRIVILEGES;

-- Disable unnecessary features
SET GLOBAL log_bin_trust_function_creators = 0;
SET GLOBAL local_infile = 0;
```

#### Connection Security
```python
# Secure database connection
SQLALCHEMY_DATABASE_URI = f'mysql+mysqlconnector://{user}:{password}@{host}:{port}/{db}?ssl_disabled=false'
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_pre_ping': True,
    'pool_recycle': 3600,
    'pool_timeout': 20,
    'max_overflow': 20
}
```

### 5. Container Security

#### Non-Root User Configuration
```dockerfile
# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser
```

#### Security Scanning
```bash
# Scan images for vulnerabilities
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  -v $HOME/Library/Caches:/root/.cache/ \
  aquasec/trivy image visitor-management-backend:latest
```

### 6. Secret Management

#### Environment Variable Security
```bash
# Set restrictive permissions on environment file
chmod 600 .env.production
chown root:root .env.production

# Use Docker secrets for sensitive data
echo "strong_database_password" | docker secret create db_password -
```

#### Secret Rotation Schedule
- **Database passwords**: Every 90 days
- **JWT secrets**: Every 30 days
- **SSL certificates**: Before expiration (auto-renewal)
- **API keys**: Every 60 days

### 7. Input Validation

#### Backend Validation
```python
from flask_wtf import FlaskForm
from wtforms import StringField, EmailField, validators

class UserRegistrationForm(FlaskForm):
    email = EmailField('Email', [
        validators.Email(),
        validators.Length(min=6, max=120)
    ])
    password = StringField('Password', [
        validators.Length(min=8, max=128),
        validators.Regexp(
            r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]',
            message="Password must contain uppercase, lowercase, digit, and special character"
        )
    ])
```

#### SQL Injection Prevention
```python
# Use parameterized queries
def get_user_by_email(email):
    return User.query.filter(User.email == email).first()

# Avoid string concatenation
# BAD: f"SELECT * FROM users WHERE email = '{email}'"
# GOOD: User.query.filter(User.email == email)
```

### 8. Authentication & Authorization

#### JWT Security
```python
# Strong JWT configuration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
JWT_ALGORITHM = 'HS256'

# Token validation
@jwt_required()
def protected_endpoint():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user)
```

#### Password Security
```python
from werkzeug.security import generate_password_hash, check_password_hash

# Strong password hashing
password_hash = generate_password_hash(
    password, 
    method='pbkdf2:sha256', 
    salt_length=8
)

# Password validation
def validate_password(password):
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'\d', password):
        return False
    if not re.search(r'[!@#$%^&*]', password):
        return False
    return True
```

### 9. Logging & Monitoring

#### Security Event Logging
```python
import logging

# Configure security logger
security_logger = logging.getLogger('security')
security_handler = logging.FileHandler('/app/logs/security.log')
security_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(levelname)s - %(message)s'
))
security_logger.addHandler(security_handler)

# Log security events
def log_failed_login(email, ip_address):
    security_logger.warning(
        f"Failed login attempt for {email} from {ip_address}"
    )

def log_suspicious_activity(user_id, activity, ip_address):
    security_logger.warning(
        f"Suspicious activity: {activity} by user {user_id} from {ip_address}"
    )
```

#### Monitoring Alerts
```bash
# Monitor failed login attempts
tail -f /app/logs/security.log | grep "Failed login" | while read line; do
    echo "ALERT: $line" | mail -s "Security Alert" admin@yourdomain.com
done

# Monitor high error rates
watch -n 60 'grep "ERROR" /app/logs/app.log | tail -10'
```

### 10. Backup Security

#### Encrypted Backups
```bash
# Create encrypted database backup
mysqldump -u vms_user -p visitor_management_prod | \
gzip | \
gpg --symmetric --cipher-algo AES256 > \
backup_$(date +%Y%m%d_%H%M%S).sql.gz.gpg
```

#### Backup Verification
```bash
# Verify backup integrity
gpg --decrypt backup_file.sql.gz.gpg | \
gunzip | \
mysql -u vms_user -p test_restore_db
```

## 🚨 Security Incident Response

### 1. Incident Detection
- Monitor security logs for anomalies
- Set up automated alerts for suspicious activities
- Regular security scans and penetration testing

### 2. Response Procedures
1. **Immediate**: Isolate affected systems
2. **Assessment**: Determine scope and impact
3. **Containment**: Stop ongoing attack
4. **Eradication**: Remove threats and vulnerabilities
5. **Recovery**: Restore systems from clean backups
6. **Lessons Learned**: Update security measures

### 3. Emergency Contacts
- **Security Team**: security@yourdomain.com
- **System Administrator**: admin@yourdomain.com
- **Management**: management@yourdomain.com

## 🔄 Security Maintenance

### Daily Tasks
- [ ] Review security logs
- [ ] Monitor failed login attempts
- [ ] Check system resource usage
- [ ] Verify backup completion

### Weekly Tasks
- [ ] Update security patches
- [ ] Review user access permissions
- [ ] Analyze security metrics
- [ ] Test backup restoration

### Monthly Tasks
- [ ] Security vulnerability assessment
- [ ] Password policy compliance check
- [ ] SSL certificate expiration check
- [ ] Security awareness training

### Quarterly Tasks
- [ ] Penetration testing
- [ ] Security policy review
- [ ] Incident response plan testing
- [ ] Compliance audit

## 📋 Security Compliance

### GDPR Compliance
- [ ] Data protection impact assessment
- [ ] User consent management
- [ ] Data retention policies
- [ ] Right to be forgotten implementation

### SOC 2 Compliance
- [ ] Access control documentation
- [ ] Change management procedures
- [ ] Monitoring and logging
- [ ] Incident response documentation

### ISO 27001 Alignment
- [ ] Information security management system
- [ ] Risk assessment and treatment
- [ ] Security awareness training
- [ ] Continuous improvement process

---

**⚠️ Security Notice**: This configuration provides enterprise-grade security for production deployment. Regular updates and monitoring are essential for maintaining security posture.

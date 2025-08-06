#!/bin/bash

# Production Deployment Script for Visitor Management System V3
# This script handles the complete deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="visitor-management-system"
DOMAIN="${DOMAIN:-localhost}"
EMAIL="${EMAIL:-admin@company.com}"
ENVIRONMENT="${ENVIRONMENT:-production}"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f ".env.production.example" ]; then
            cp .env.production.example .env
            print_warning "Please edit .env file with your production values before continuing."
            read -p "Press Enter to continue after editing .env file..."
        else
            print_error ".env.production.example file not found. Please create .env file manually."
            exit 1
        fi
    fi
    
    print_success "Prerequisites check completed."
}

# Generate SSL certificates (self-signed for testing)
generate_ssl_certificates() {
    print_status "Generating SSL certificates..."
    
    mkdir -p nginx/ssl
    
    if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/private.key" ]; then
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/private.key \
            -out nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=${DOMAIN}"
        
        print_success "SSL certificates generated."
    else
        print_status "SSL certificates already exist."
    fi
}

# Build and start services
build_and_deploy() {
    print_status "Building and deploying services..."
    
    # Pull latest images
    docker-compose -f docker-compose.prod.yml pull
    
    # Build custom images
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Start services
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Services deployed successfully."
}

# Wait for services to be healthy
wait_for_services() {
    print_status "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f docker-compose.prod.yml ps | grep -q "healthy"; then
            print_success "Services are healthy."
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - waiting for services..."
        sleep 10
        ((attempt++))
    done
    
    print_error "Services failed to become healthy within expected time."
    exit 1
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Wait for database to be ready
    sleep 30
    
    # The init.sql script is automatically run by MySQL container
    print_success "Database initialized."
}

# Create backup script
create_backup_script() {
    print_status "Creating backup script..."
    
    cat > scripts/backup.sh << 'EOF'
#!/bin/bash

# Backup script for Visitor Management System
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="vms_mysql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker exec $DB_CONTAINER mysqldump -u root -p$MYSQL_ROOT_PASSWORD visitor_management_prod > $BACKUP_DIR/db_backup_$DATE.sql

# Backup uploaded files
docker cp vms_backend:/app/uploads $BACKUP_DIR/uploads_$DATE

# Compress backups older than 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -exec gzip {} \;

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
find $BACKUP_DIR -type d -name "uploads_*" -mtime +30 -exec rm -rf {} \;

echo "Backup completed: $DATE"
EOF

    chmod +x scripts/backup.sh
    print_success "Backup script created."
}

# Setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Create monitoring docker-compose file
    cat > docker-compose.monitoring.yml << 'EOF'
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: vms_prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - vms_network

  grafana:
    image: grafana/grafana:latest
    container_name: vms_grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    networks:
      - vms_network

volumes:
  prometheus_data:
  grafana_data:

networks:
  vms_network:
    external: true
EOF

    mkdir -p monitoring
    
    # Create Prometheus config
    cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'visitor-management-backend'
    static_configs:
      - targets: ['backend:5000']
    metrics_path: /metrics
    scrape_interval: 30s
EOF

    print_success "Monitoring setup completed."
}

# Display final information
display_final_info() {
    print_success "Deployment completed successfully!"
    echo ""
    echo "Service URLs:"
    echo "  Frontend: https://${DOMAIN}"
    echo "  Backend API: https://${DOMAIN}/api"
    echo "  Database: localhost:3306"
    echo ""
    echo "Admin Login:"
    echo "  Username: admin"
    echo "  Password: admin123"
    echo "  Email: admin@company.com"
    echo ""
    echo "Management Commands:"
    echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  Stop services: docker-compose -f docker-compose.prod.yml down"
    echo "  Restart services: docker-compose -f docker-compose.prod.yml restart"
    echo "  Run backup: ./scripts/backup.sh"
    echo ""
    print_warning "Please change the default admin password immediately!"
    print_warning "Update .env file with proper production values!"
}

# Main deployment process
main() {
    echo "========================================"
    echo "Visitor Management System V3 Deployment"
    echo "========================================"
    echo ""
    
    check_prerequisites
    generate_ssl_certificates
    build_and_deploy
    wait_for_services
    run_migrations
    create_backup_script
    setup_monitoring
    display_final_info
}

# Run main function
main "$@"

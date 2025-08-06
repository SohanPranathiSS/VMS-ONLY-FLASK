#!/bin/bash

# Comprehensive Testing Script for Production Deployment
# Tests all aspects of the production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
DOMAIN="localhost"
API_URL="https://$DOMAIN/api"
FRONTEND_URL="https://$DOMAIN"
MAX_WAIT_TIME=300
HEALTH_CHECK_INTERVAL=5

echo -e "${BLUE}🧪 Starting Comprehensive Production Deployment Tests${NC}"
echo "=================================================="

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local service_name=$2
    local timeout=$3
    local elapsed=0
    
    echo -e "${YELLOW}⏳ Waiting for $service_name to be ready...${NC}"
    
    while [ $elapsed -lt $timeout ]; do
        if curl -k -s --connect-timeout 5 "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready${NC}"
            return 0
        fi
        sleep $HEALTH_CHECK_INTERVAL
        elapsed=$((elapsed + HEALTH_CHECK_INTERVAL))
        echo -n "."
    done
    
    echo -e "${RED}❌ $service_name failed to start within ${timeout}s${NC}"
    return 1
}

# Test 1: Docker containers are running
echo -e "\n${BLUE}Test 1: Container Health${NC}"
echo "-------------------------"

CONTAINERS=("mysql" "redis" "backend" "frontend" "nginx")
for container in "${CONTAINERS[@]}"; do
    if docker-compose -f docker-compose.prod.yml ps | grep -q "$container.*Up"; then
        print_result 0 "$container container is running"
    else
        print_result 1 "$container container is not running"
    fi
done

# Test 2: Network connectivity
echo -e "\n${BLUE}Test 2: Network Connectivity${NC}"
echo "------------------------------"

# Check if ports are accessible
PORTS=("80" "443" "3306" "6379")
for port in "${PORTS[@]}"; do
    if netstat -tuln | grep -q ":$port "; then
        print_result 0 "Port $port is accessible"
    else
        print_result 1 "Port $port is not accessible"
    fi
done

# Test 3: SSL Certificate validation
echo -e "\n${BLUE}Test 3: SSL Certificate Validation${NC}"
echo "------------------------------------"

if [ -f "ssl/server.crt" ] && [ -f "ssl/server.key" ]; then
    print_result 0 "SSL certificate files exist"
    
    # Check certificate validity
    if openssl x509 -in ssl/server.crt -noout -checkend 86400; then
        print_result 0 "SSL certificate is valid"
    else
        print_result 1 "SSL certificate is expired or invalid"
    fi
    
    # Check certificate details
    CERT_SUBJECT=$(openssl x509 -in ssl/server.crt -noout -subject | cut -d= -f2-)
    echo -e "${BLUE}   Certificate Subject: $CERT_SUBJECT${NC}"
    
    CERT_EXPIRY=$(openssl x509 -in ssl/server.crt -noout -enddate | cut -d= -f2)
    echo -e "${BLUE}   Certificate Expires: $CERT_EXPIRY${NC}"
else
    print_result 1 "SSL certificate files not found"
fi

# Test 4: Database connectivity and schema
echo -e "\n${BLUE}Test 4: Database Testing${NC}"
echo "-------------------------"

# Wait for database to be ready
wait_for_service "mysql://localhost:3306" "MySQL Database" 60

# Test database connection
if docker-compose -f docker-compose.prod.yml exec -T mysql mysql -u vms_user -p$(grep DATABASE_PASSWORD .env.production | cut -d= -f2) -e "SELECT 1;" > /dev/null 2>&1; then
    print_result 0 "Database connection successful"
    
    # Check if tables exist
    TABLES=$(docker-compose -f docker-compose.prod.yml exec -T mysql mysql -u vms_user -p$(grep DATABASE_PASSWORD .env.production | cut -d= -f2) -D visitor_management_prod -e "SHOW TABLES;" 2>/dev/null | tail -n +2 | wc -l)
    if [ "$TABLES" -gt 0 ]; then
        print_result 0 "Database schema initialized ($TABLES tables found)"
    else
        print_result 1 "Database schema not initialized"
    fi
else
    print_result 1 "Database connection failed"
fi

# Test 5: Redis connectivity
echo -e "\n${BLUE}Test 5: Redis Cache Testing${NC}"
echo "-----------------------------"

if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping | grep -q "PONG"; then
    print_result 0 "Redis connection successful"
    
    # Test Redis functionality
    docker-compose -f docker-compose.prod.yml exec -T redis redis-cli set test_key "test_value" > /dev/null
    if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli get test_key | grep -q "test_value"; then
        print_result 0 "Redis read/write operations working"
        docker-compose -f docker-compose.prod.yml exec -T redis redis-cli del test_key > /dev/null
    else
        print_result 1 "Redis read/write operations failed"
    fi
else
    print_result 1 "Redis connection failed"
fi

# Test 6: Backend API testing
echo -e "\n${BLUE}Test 6: Backend API Testing${NC}"
echo "-----------------------------"

# Wait for backend to be ready
wait_for_service "$API_URL/health" "Backend API" 120

# Test health endpoint
if curl -k -s "$API_URL/health" | grep -q "healthy"; then
    print_result 0 "Backend health endpoint responding"
else
    print_result 1 "Backend health endpoint not responding"
fi

# Test API endpoints
API_ENDPOINTS=("/health" "/api/auth/status" "/api/users/profile")
for endpoint in "${API_ENDPOINTS[@]}"; do
    HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "$API_URL$endpoint")
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ]; then
        print_result 0 "API endpoint $endpoint accessible (HTTP $HTTP_CODE)"
    else
        print_result 1 "API endpoint $endpoint not accessible (HTTP $HTTP_CODE)"
    fi
done

# Test 7: Frontend testing
echo -e "\n${BLUE}Test 7: Frontend Testing${NC}"
echo "-------------------------"

# Wait for frontend to be ready
wait_for_service "$FRONTEND_URL" "Frontend" 60

# Test frontend accessibility
HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$HTTP_CODE" -eq 200 ]; then
    print_result 0 "Frontend accessible (HTTP $HTTP_CODE)"
    
    # Check if React app is loaded
    if curl -k -s "$FRONTEND_URL" | grep -q "root"; then
        print_result 0 "React application loaded"
    else
        print_result 1 "React application not loaded properly"
    fi
else
    print_result 1 "Frontend not accessible (HTTP $HTTP_CODE)"
fi

# Test 8: Security headers
echo -e "\n${BLUE}Test 8: Security Headers Testing${NC}"
echo "----------------------------------"

SECURITY_HEADERS=("Strict-Transport-Security" "X-Content-Type-Options" "X-Frame-Options" "X-XSS-Protection")
for header in "${SECURITY_HEADERS[@]}"; do
    if curl -k -s -I "$FRONTEND_URL" | grep -qi "$header"; then
        print_result 0 "Security header $header present"
    else
        print_result 1 "Security header $header missing"
    fi
done

# Test 9: Performance testing
echo -e "\n${BLUE}Test 9: Performance Testing${NC}"
echo "----------------------------"

# Test response times
FRONTEND_TIME=$(curl -k -s -o /dev/null -w "%{time_total}" "$FRONTEND_URL")
API_TIME=$(curl -k -s -o /dev/null -w "%{time_total}" "$API_URL/health")

if (( $(echo "$FRONTEND_TIME < 3.0" | bc -l) )); then
    print_result 0 "Frontend response time acceptable (${FRONTEND_TIME}s)"
else
    print_result 1 "Frontend response time too slow (${FRONTEND_TIME}s)"
fi

if (( $(echo "$API_TIME < 1.0" | bc -l) )); then
    print_result 0 "API response time acceptable (${API_TIME}s)"
else
    print_result 1 "API response time too slow (${API_TIME}s)"
fi

# Test 10: Resource usage
echo -e "\n${BLUE}Test 10: Resource Usage Testing${NC}"
echo "--------------------------------"

# Check container resource usage
echo -e "${BLUE}Container Resource Usage:${NC}"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

# Check disk usage
DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    print_result 0 "Disk usage acceptable (${DISK_USAGE}%)"
else
    print_result 1 "Disk usage high (${DISK_USAGE}%)"
fi

# Test 11: Log file validation
echo -e "\n${BLUE}Test 11: Log File Validation${NC}"
echo "------------------------------"

LOG_DIRS=("Backend/logs" "database/logs")
for log_dir in "${LOG_DIRS[@]}"; do
    if [ -d "$log_dir" ]; then
        print_result 0 "Log directory $log_dir exists"
        
        # Check if logs are being written
        if [ -n "$(find $log_dir -name "*.log" -newer <(date -d '1 hour ago' '+%Y%m%d %H:%M:%S'))" ]; then
            print_result 0 "Recent log entries found in $log_dir"
        else
            print_result 1 "No recent log entries in $log_dir"
        fi
    else
        print_result 1 "Log directory $log_dir missing"
    fi
done

# Test 12: Backup validation
echo -e "\n${BLUE}Test 12: Backup System Validation${NC}"
echo "-----------------------------------"

if [ -d "database/backups" ]; then
    print_result 0 "Backup directory exists"
    
    # Check for recent backups
    RECENT_BACKUPS=$(find database/backups -name "*.sql" -mtime -1 | wc -l)
    if [ "$RECENT_BACKUPS" -gt 0 ]; then
        print_result 0 "Recent database backups found ($RECENT_BACKUPS)"
    else
        print_result 1 "No recent database backups found"
    fi
else
    print_result 1 "Backup directory missing"
fi

# Test 13: Environment configuration
echo -e "\n${BLUE}Test 13: Environment Configuration${NC}"
echo "------------------------------------"

if [ -f ".env.production" ]; then
    print_result 0 "Production environment file exists"
    
    # Check required variables
    REQUIRED_VARS=("SECRET_KEY" "DATABASE_PASSWORD" "JWT_SECRET_KEY")
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$var=" .env.production; then
            print_result 0 "Environment variable $var configured"
        else
            print_result 1 "Environment variable $var missing"
        fi
    done
else
    print_result 1 "Production environment file missing"
fi

# Summary
echo -e "\n${BLUE}🎯 Test Summary${NC}"
echo "================"

TOTAL_TESTS=$(grep -c "print_result" "$0")
echo -e "${BLUE}Total tests executed: $TOTAL_TESTS${NC}"

# Check overall health
FAILED_SERVICES=$(docker-compose -f docker-compose.prod.yml ps | grep -c "Exit\|unhealthy" || true)
if [ "$FAILED_SERVICES" -eq 0 ]; then
    echo -e "${GREEN}🎉 All services are running successfully!${NC}"
    echo -e "${GREEN}🚀 Production deployment is ready for use.${NC}"
else
    echo -e "${RED}⚠️  Some services have issues. Check the logs for details.${NC}"
    exit 1
fi

# Additional information
echo -e "\n${BLUE}📊 System Information:${NC}"
echo "----------------------"
echo -e "${BLUE}Frontend URL:${NC} $FRONTEND_URL"
echo -e "${BLUE}API URL:${NC} $API_URL"
echo -e "${BLUE}Database:${NC} MySQL 8.0"
echo -e "${BLUE}Cache:${NC} Redis"
echo -e "${BLUE}Web Server:${NC} Nginx with SSL"
echo -e "${BLUE}Application Server:${NC} Gunicorn"

echo -e "\n${GREEN}✅ Production deployment testing completed successfully!${NC}"
echo -e "${YELLOW}💡 For continuous monitoring, run: ./health-check.sh${NC}"

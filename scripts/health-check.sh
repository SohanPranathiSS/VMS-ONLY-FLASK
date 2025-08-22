#!/bin/bash

# Health Check Script for Visitor Management System V3
# Monitors all services and sends alerts if issues are detected

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
EMAIL_ALERT="${EMAIL_ALERT:-admin@company.com}"
LOG_FILE="/var/log/vms-health.log"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
    echo "$(date): [INFO] $1" >> $LOG_FILE
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    echo "$(date): [SUCCESS] $1" >> $LOG_FILE
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    echo "$(date): [WARNING] $1" >> $LOG_FILE
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "$(date): [ERROR] $1" >> $LOG_FILE
}

# Function to send alert
send_alert() {
    local message="$1"
    local severity="$2"
    
    # Log the alert
    print_error "ALERT: $message"
    
    # Send Slack notification if configured
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 VMS Alert [$severity]: $message\"}" \
            "$SLACK_WEBHOOK"
    fi
    
    # Send email if configured (requires mailutils)
    if command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "VMS Alert [$severity]" "$EMAIL_ALERT"
    fi
}

# Check Docker services
check_docker_services() {
    print_status "Checking Docker services..."
    
    local services=("vms_mysql" "vms_backend" "vms_frontend" "vms_nginx" "vms_redis")
    local failed_services=()
    
    for service in "${services[@]}"; do
        if ! docker ps --format "table {{.Names}}" | grep -q "$service"; then
            failed_services+=("$service")
        fi
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        print_success "All Docker services are running"
    else
        send_alert "Docker services not running: ${failed_services[*]}" "HIGH"
        return 1
    fi
}

# Check service health
check_service_health() {
    print_status "Checking service health..."
    
    # Check backend health
    if ! curl -f -s "http://localhost:5000/health" > /dev/null; then
        send_alert "Backend health check failed" "HIGH"
        return 1
    fi
    
    # Check frontend
    if ! curl -f -s "http://localhost:3000" > /dev/null; then
        send_alert "Frontend health check failed" "HIGH"
        return 1
    fi
    
    # Check database connectivity
    if ! docker exec vms_mysql mysqladmin ping -h localhost --silent; then
        send_alert "Database health check failed" "CRITICAL"
        return 1
    fi
    
    # Check Redis
    if ! docker exec vms_redis redis-cli ping | grep -q "PONG"; then
        send_alert "Redis health check failed" "MEDIUM"
        return 1
    fi
    
    print_success "All services are healthy"
}

# Check disk space
check_disk_space() {
    print_status "Checking disk space..."
    
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -gt 90 ]; then
        send_alert "Disk space critical: ${usage}% used" "CRITICAL"
    elif [ "$usage" -gt 80 ]; then
        send_alert "Disk space warning: ${usage}% used" "MEDIUM"
    else
        print_success "Disk space OK: ${usage}% used"
    fi
}

# Check memory usage
check_memory_usage() {
    print_status "Checking memory usage..."
    
    local memory_usage=$(free | awk 'FNR==2{printf "%.0f", $3/($3+$4)*100}')
    
    if [ "$memory_usage" -gt 90 ]; then
        send_alert "Memory usage critical: ${memory_usage}%" "HIGH"
    elif [ "$memory_usage" -gt 80 ]; then
        send_alert "Memory usage warning: ${memory_usage}%" "MEDIUM"
    else
        print_success "Memory usage OK: ${memory_usage}%"
    fi
}

# Check database connections
check_database_connections() {
    print_status "Checking database connections..."
    
    local connections=$(docker exec vms_mysql mysql -u root -p$MYSQL_ROOT_PASSWORD -e "SHOW STATUS LIKE 'Threads_connected';" | awk 'NR==2 {print $2}')
    local max_connections=$(docker exec vms_mysql mysql -u root -p$MYSQL_ROOT_PASSWORD -e "SHOW VARIABLES LIKE 'max_connections';" | awk 'NR==2 {print $2}')
    
    local usage_percent=$((connections * 100 / max_connections))
    
    if [ "$usage_percent" -gt 80 ]; then
        send_alert "Database connections high: $connections/$max_connections (${usage_percent}%)" "MEDIUM"
    else
        print_success "Database connections OK: $connections/$max_connections (${usage_percent}%)"
    fi
}

# Check log file sizes
check_log_sizes() {
    print_status "Checking log file sizes..."
    
    local log_files=("/var/log/nginx/access.log" "/var/log/nginx/error.log")
    
    for log_file in "${log_files[@]}"; do
        if [ -f "$log_file" ]; then
            local size=$(stat --format="%s" "$log_file")
            local size_mb=$((size / 1024 / 1024))
            
            if [ "$size_mb" -gt 1000 ]; then
                send_alert "Log file large: $log_file (${size_mb}MB)" "MEDIUM"
            fi
        fi
    done
    
    print_success "Log file sizes OK"
}

# Check SSL certificate expiry
check_ssl_expiry() {
    print_status "Checking SSL certificate expiry..."
    
    if [ -f "nginx/ssl/cert.pem" ]; then
        local expiry_date=$(openssl x509 -enddate -noout -in nginx/ssl/cert.pem | cut -d= -f2)
        local expiry_epoch=$(date -d "$expiry_date" +%s)
        local current_epoch=$(date +%s)
        local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
        
        if [ "$days_until_expiry" -lt 30 ]; then
            send_alert "SSL certificate expires in $days_until_expiry days" "HIGH"
        elif [ "$days_until_expiry" -lt 60 ]; then
            send_alert "SSL certificate expires in $days_until_expiry days" "MEDIUM"
        else
            print_success "SSL certificate valid for $days_until_expiry days"
        fi
    fi
}

# Check application metrics
check_application_metrics() {
    print_status "Checking application metrics..."
    
    # Check if there are any recent errors in logs
    local error_count=$(docker logs vms_backend --since="1h" 2>&1 | grep -c "ERROR" || true)
    
    if [ "$error_count" -gt 10 ]; then
        send_alert "High error count in backend logs: $error_count errors in last hour" "MEDIUM"
    else
        print_success "Application error count OK: $error_count errors in last hour"
    fi
    
    # Check response time
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" "http://localhost:5000/health")
    local response_ms=$(echo "$response_time * 1000" | bc)
    
    if [ "$(echo "$response_time > 5" | bc)" -eq 1 ]; then
        send_alert "High response time: ${response_ms}ms" "MEDIUM"
    else
        print_success "Response time OK: ${response_ms}ms"
    fi
}

# Generate health report
generate_health_report() {
    print_status "Generating health report..."
    
    local report_file="/tmp/vms-health-report-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "========================================"
        echo "Visitor Management System Health Report"
        echo "Generated: $(date)"
        echo "========================================"
        echo ""
        
        echo "System Information:"
        echo "  Hostname: $(hostname)"
        echo "  Uptime: $(uptime | awk '{print $3,$4}' | sed 's/,//')"
        echo "  Load Average: $(uptime | awk -F'load average:' '{print $2}')"
        echo ""
        
        echo "Docker Services:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        
        echo "Resource Usage:"
        echo "  CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')%"
        echo "  Memory: $(free -h | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
        echo "  Disk: $(df -h / | awk 'NR==2{print $5}')"
        echo ""
        
        echo "Network Connections:"
        netstat -an | grep :80 | wc -l | awk '{print "  HTTP Connections: " $1}'
        netstat -an | grep :443 | wc -l | awk '{print "  HTTPS Connections: " $1}'
        netstat -an | grep :3306 | wc -l | awk '{print "  MySQL Connections: " $1}'
        
    } > "$report_file"
    
    print_success "Health report generated: $report_file"
}

# Main health check function
main() {
    echo "========================================"
    echo "VMS Health Check - $(date)"
    echo "========================================"
    echo ""
    
    local exit_code=0
    
    check_docker_services || exit_code=1
    check_service_health || exit_code=1
    check_disk_space || exit_code=1
    check_memory_usage || exit_code=1
    check_database_connections || exit_code=1
    check_log_sizes || exit_code=1
    check_ssl_expiry || exit_code=1
    check_application_metrics || exit_code=1
    
    if [ "$1" = "--report" ]; then
        generate_health_report
    fi
    
    if [ $exit_code -eq 0 ]; then
        print_success "All health checks passed!"
    else
        print_error "Some health checks failed!"
    fi
    
    exit $exit_code
}

# Run main function
main "$@"

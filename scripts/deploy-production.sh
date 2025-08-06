#!/bin/bash

# Production Deployment Script
# This script deploys the Visitor Management System to production

set -e

echo "🚀 Starting production deployment..."

# Check if required environment files exist
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found"
    echo "Please create .env.production with production configuration"
    exit 1
fi

# Load environment variables
source .env.production

echo "📋 Pre-deployment checks..."

# Check Docker and Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi

# Check if SSL certificates exist
if [ ! -f "./nginx/ssl/cert.pem" ]; then
    echo "⚠️  SSL certificate not found. Generating self-signed certificate..."
    mkdir -p ./nginx/ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ./nginx/ssl/key.pem \
        -out ./nginx/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    echo "✅ Self-signed SSL certificate generated"
fi

echo "🏗️  Building production images..."

# Build production Docker images
docker-compose -f docker-compose.production.yml build

echo "🗄️  Setting up database..."

# Create database backup directory
mkdir -p ./backups

# Start database first
docker-compose -f docker-compose.production.yml up -d mysql

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 30

# Run database migrations (if needed)
echo "🔄 Running database migrations..."
# Add migration commands here if you have them

echo "📊 Starting monitoring services..."

# Start monitoring services
docker-compose -f docker-compose.production.yml up -d prometheus grafana

echo "🚀 Starting application services..."

# Start all services
docker-compose -f docker-compose.production.yml up -d

echo "⏳ Waiting for services to start..."
sleep 60

echo "🔍 Performing health checks..."

# Health check function
check_service() {
    local service_name=$1
    local health_url=$2
    local max_attempts=30
    local attempt=1

    echo "Checking $service_name..."
    while [ $attempt -le $max_attempts ]; do
        if curl -f $health_url &> /dev/null; then
            echo "✅ $service_name is healthy"
            return 0
        fi
        echo "⏳ Attempt $attempt/$max_attempts - $service_name not ready yet..."
        sleep 10
        ((attempt++))
    done
    
    echo "❌ $service_name health check failed"
    return 1
}

# Perform health checks
check_service "Backend API" "http://localhost/api/health"
check_service "Frontend" "http://localhost/"
check_service "ML Service" "http://localhost/ml/health"

echo "📊 Checking service status..."
docker-compose -f docker-compose.production.yml ps

echo "📈 Setting up monitoring dashboards..."
echo "Grafana Dashboard: http://localhost:3000"
echo "Prometheus Metrics: http://localhost:9090"

echo "🎉 Production deployment completed successfully!"
echo ""
echo "📋 Post-deployment checklist:"
echo "  ✅ All services are running"
echo "  ✅ Health checks passed"
echo "  ✅ SSL certificates configured"
echo "  ✅ Monitoring dashboards available"
echo ""
echo "🔗 Access URLs:"
echo "  Main Application: https://localhost"
echo "  API Documentation: https://localhost/api/docs"
echo "  Monitoring: http://localhost:3000"
echo ""
echo "⚠️  Important:"
echo "  - Update DNS records to point to this server"
echo "  - Configure SSL certificates from a trusted CA"
echo "  - Set up regular database backups"
echo "  - Monitor application logs and metrics"
echo ""
echo "📝 To view logs: docker-compose -f docker-compose.production.yml logs -f"
echo "🛑 To stop services: docker-compose -f docker-compose.production.yml down"

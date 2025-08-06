# Docker Configuration

This directory contains all Docker-related configuration files for the Visitor Management System.

## Files Structure

```
docker/
├── Dockerfile.backend          # Backend Flask application container
├── Dockerfile.frontend         # Frontend React application container
├── Dockerfile.ml              # ML service container
├── nginx.conf                 # Nginx reverse proxy configuration
├── docker-compose.yml         # Development environment
├── docker-compose.prod.yml    # Production environment
└── .dockerignore              # Docker ignore patterns
```

## Container Architecture

### Backend Container
- **Base Image**: Python 3.11-slim
- **Framework**: Flask with Gunicorn WSGI server
- **Features**: Multi-stage build, non-root user, security hardening
- **Ports**: 5000 (internal)
- **Dependencies**: requirements.txt, requirements.prod.txt

### Frontend Container
- **Base Image**: Node.js 18 (build), Nginx (runtime)
- **Framework**: React with optimized production build
- **Features**: Multi-stage build, static file serving, compression
- **Ports**: 80 (internal)
- **Dependencies**: package.json

### ML Container
- **Base Image**: Python 3.11-slim
- **Framework**: Flask with ML libraries
- **Features**: OCR, document processing, AI capabilities
- **Ports**: 5001 (internal)
- **Dependencies**: ML/requirements.txt

### Nginx Container
- **Base Image**: Nginx Alpine
- **Purpose**: Reverse proxy, SSL termination, static file serving
- **Features**: Security headers, rate limiting, compression
- **Ports**: 80, 443

## Environment Configurations

### Development (docker-compose.yml)
- Hot reloading enabled
- Debug mode active
- Volume mounts for development
- SQLite database for simplicity

### Production (docker-compose.prod.yml)
- Optimized builds
- Security hardening
- MySQL database
- Redis caching
- SSL/TLS encryption
- Health checks and monitoring

## Usage

### Development Environment
```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Rebuild specific service
docker-compose up --build backend
```

### Production Environment
```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Update application
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Security Features

### Container Security
- Non-root users in all containers
- Minimal base images
- Security scanning enabled
- Resource limits configured

### Network Security
- Internal service networks
- Port exposure limited to necessary services
- SSL/TLS encryption for external traffic

### Data Security
- Volume encryption options
- Secret management
- Environment variable isolation

## Monitoring & Logging

### Health Checks
- Application health endpoints
- Database connectivity checks
- Service dependency validation

### Logging
- Centralized log collection
- Log rotation and retention
- Structured logging format

### Metrics
- Container resource usage
- Application performance metrics
- Custom business metrics

## Troubleshooting

### Common Issues
1. **Port conflicts**: Check for other services using ports 80, 443, 3306, 6379
2. **Permission issues**: Ensure Docker daemon is running with proper permissions
3. **Memory issues**: Monitor container resource usage
4. **Network issues**: Check Docker network configuration

### Debug Commands
```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs [service_name]

# Execute commands in container
docker-compose exec backend bash

# Check resource usage
docker stats
```

## Optimization Tips

### Performance
- Use multi-stage builds to reduce image size
- Implement proper caching strategies
- Optimize database connections
- Enable compression for static assets

### Scalability
- Use load balancers for high traffic
- Implement horizontal scaling
- Optimize database queries
- Cache frequently accessed data

### Maintenance
- Regular image updates
- Security patch management
- Database backup strategies
- Log rotation and cleanup

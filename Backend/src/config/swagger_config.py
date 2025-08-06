"""
API Documentation Configuration
Swagger/OpenAPI setup for the Visitor Management System
"""

from flasgger import Swagger
from flask import Flask

def configure_swagger(app: Flask):
    """Configure Swagger documentation for the Flask app."""
    
    swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": 'apispec',
                "route": '/api/docs/apispec.json',
                "rule_filter": lambda rule: True,
                "model_filter": lambda tag: True,
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/api/docs/"
    }

    swagger_template = {
        "swagger": "2.0",
        "info": {
            "title": "Visitor Management System API",
            "description": "AI-powered visitor management system with ID card detection",
            "contact": {
                "name": "VMS Development Team",
                "email": "dev@visitormanagement.com"
            },
            "version": "3.0.0"
        },
        "host": "localhost:5000",
        "basePath": "/api",
        "schemes": ["http", "https"],
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\""
            }
        },
        "security": [
            {
                "Bearer": []
            }
        ],
        "tags": [
            {
                "name": "Authentication",
                "description": "User authentication and authorization"
            },
            {
                "name": "Visitors",
                "description": "Visitor management operations"
            },
            {
                "name": "Admin",
                "description": "Administrative functions"
            },
            {
                "name": "Reports",
                "description": "Analytics and reporting"
            },
            {
                "name": "ML Services",
                "description": "AI and machine learning endpoints"
            }
        ],
        "responses": {
            "UnauthorizedError": {
                "description": "Authentication information is missing or invalid",
                "schema": {
                    "type": "object",
                    "properties": {
                        "error": {
                            "type": "string",
                            "example": "Unauthorized access"
                        }
                    }
                }
            },
            "ValidationError": {
                "description": "Input validation failed",
                "schema": {
                    "type": "object",
                    "properties": {
                        "error": {
                            "type": "string",
                            "example": "Validation failed"
                        },
                        "details": {
                            "type": "object"
                        }
                    }
                }
            }
        }
    }

    # Initialize Swagger
    swagger = Swagger(app, config=swagger_config, template=swagger_template)
    
    return swagger

"""
API Documentation Examples
Swagger documentation for authentication endpoints
"""

# Login endpoint documentation
login_docs = {
    "tags": ["Authentication"],
    "summary": "User login",
    "description": "Authenticate user and return JWT token",
    "parameters": [
        {
            "name": "credentials",
            "in": "body",
            "required": True,
            "schema": {
                "type": "object",
                "required": ["email", "password"],
                "properties": {
                    "email": {
                        "type": "string",
                        "format": "email",
                        "example": "admin@example.com",
                        "description": "User email address"
                    },
                    "password": {
                        "type": "string",
                        "format": "password",
                        "example": "securepassword",
                        "description": "User password"
                    }
                }
            }
        }
    ],
    "responses": {
        "200": {
            "description": "Login successful",
            "schema": {
                "type": "object",
                "properties": {
                    "token": {
                        "type": "string",
                        "example": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                        "description": "JWT authentication token"
                    },
                    "user": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "integer", "example": 1},
                            "name": {"type": "string", "example": "John Doe"},
                            "email": {"type": "string", "example": "john@example.com"},
                            "role": {"type": "string", "example": "admin"}
                        }
                    },
                    "expires_in": {
                        "type": "integer",
                        "example": 3600,
                        "description": "Token expiration time in seconds"
                    }
                }
            }
        },
        "401": {
            "description": "Invalid credentials",
            "schema": {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string",
                        "example": "Invalid email or password"
                    }
                }
            }
        },
        "422": {
            "$ref": "#/responses/ValidationError"
        }
    }
}

# Visitor check-in documentation
visitor_checkin_docs = {
    "tags": ["Visitors"],
    "summary": "Check-in a visitor",
    "description": "Register a new visitor check-in with ID card detection",
    "security": [{"Bearer": []}],
    "consumes": ["multipart/form-data"],
    "parameters": [
        {
            "name": "name",
            "in": "formData",
            "type": "string",
            "required": True,
            "example": "John Doe",
            "description": "Visitor's full name"
        },
        {
            "name": "email",
            "in": "formData",
            "type": "string",
            "format": "email",
            "required": True,
            "example": "john@example.com",
            "description": "Visitor's email address"
        },
        {
            "name": "phone",
            "in": "formData",
            "type": "string",
            "required": True,
            "example": "+1234567890",
            "description": "Visitor's phone number"
        },
        {
            "name": "host_id",
            "in": "formData",
            "type": "integer",
            "required": True,
            "example": 1,
            "description": "ID of the host being visited"
        },
        {
            "name": "purpose",
            "in": "formData",
            "type": "string",
            "required": True,
            "example": "Business Meeting",
            "description": "Purpose of visit"
        },
        {
            "name": "id_card_type",
            "in": "formData",
            "type": "string",
            "enum": ["aadhaar", "pan", "driving_license", "passport", "voter_id", "employee_id", "other"],
            "required": False,
            "example": "aadhaar",
            "description": "Type of ID card (auto-detected if not provided)"
        },
        {
            "name": "id_card_photo",
            "in": "formData",
            "type": "file",
            "required": True,
            "description": "Photo of the ID card for AI detection"
        },
        {
            "name": "visitor_photo",
            "in": "formData",
            "type": "file",
            "required": True,
            "description": "Photo of the visitor"
        }
    ],
    "responses": {
        "201": {
            "description": "Visitor checked in successfully",
            "schema": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer", "example": 123},
                    "visitor_id": {"type": "string", "example": "VIS-2025-001"},
                    "name": {"type": "string", "example": "John Doe"},
                    "check_in_time": {"type": "string", "format": "datetime", "example": "2025-08-05T10:30:00Z"},
                    "qr_code": {"type": "string", "example": "data:image/png;base64,iVBORw0KGgoA..."},
                    "id_card_detection": {
                        "type": "object",
                        "properties": {
                            "detected_type": {"type": "string", "example": "aadhaar"},
                            "confidence": {"type": "number", "example": 0.95},
                            "auto_detected": {"type": "boolean", "example": True}
                        }
                    }
                }
            }
        },
        "401": {"$ref": "#/responses/UnauthorizedError"},
        "422": {"$ref": "#/responses/ValidationError"}
    }
}

# Dashboard analytics documentation
dashboard_docs = {
    "tags": ["Admin"],
    "summary": "Get dashboard analytics",
    "description": "Retrieve real-time dashboard statistics and analytics",
    "security": [{"Bearer": []}],
    "parameters": [
        {
            "name": "date_range",
            "in": "query",
            "type": "string",
            "enum": ["today", "week", "month", "year"],
            "default": "today",
            "description": "Date range for analytics"
        }
    ],
    "responses": {
        "200": {
            "description": "Dashboard data retrieved successfully",
            "schema": {
                "type": "object",
                "properties": {
                    "summary": {
                        "type": "object",
                        "properties": {
                            "total_visitors": {"type": "integer", "example": 150},
                            "checked_in": {"type": "integer", "example": 25},
                            "checked_out": {"type": "integer", "example": 125},
                            "blacklisted": {"type": "integer", "example": 2}
                        }
                    },
                    "hourly_distribution": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "hour": {"type": "integer", "example": 10},
                                "count": {"type": "integer", "example": 15}
                            }
                        }
                    },
                    "id_card_types": {
                        "type": "object",
                        "properties": {
                            "aadhaar": {"type": "integer", "example": 80},
                            "pan": {"type": "integer", "example": 30},
                            "driving_license": {"type": "integer", "example": 25},
                            "passport": {"type": "integer", "example": 10},
                            "other": {"type": "integer", "example": 5}
                        }
                    },
                    "ai_detection_accuracy": {
                        "type": "object",
                        "properties": {
                            "average_confidence": {"type": "number", "example": 0.92},
                            "successful_detections": {"type": "integer", "example": 145},
                            "manual_corrections": {"type": "integer", "example": 5}
                        }
                    }
                }
            }
        },
        "401": {"$ref": "#/responses/UnauthorizedError"},
        "403": {
            "description": "Insufficient permissions",
            "schema": {
                "type": "object",
                "properties": {
                    "error": {"type": "string", "example": "Admin access required"}
                }
            }
        }
    }
}

# ID Card detection documentation
id_detection_docs = {
    "tags": ["ML Services"],
    "summary": "Detect ID card type",
    "description": "AI-powered ID card type detection using OCR and machine learning",
    "consumes": ["multipart/form-data"],
    "parameters": [
        {
            "name": "image",
            "in": "formData",
            "type": "file",
            "required": True,
            "description": "ID card image for detection"
        },
        {
            "name": "enhance_image",
            "in": "formData",
            "type": "boolean",
            "default": True,
            "description": "Apply image enhancement preprocessing"
        }
    ],
    "responses": {
        "200": {
            "description": "ID card detection completed",
            "schema": {
                "type": "object",
                "properties": {
                    "card_type": {
                        "type": "string",
                        "enum": ["aadhaar", "pan", "driving_license", "passport", "voter_id", "employee_id", "other"],
                        "example": "aadhaar"
                    },
                    "confidence": {
                        "type": "number",
                        "minimum": 0.0,
                        "maximum": 1.0,
                        "example": 0.95,
                        "description": "Confidence score of the detection"
                    },
                    "detected_text": {
                        "type": "array",
                        "items": {"type": "string"},
                        "example": ["AADHAAR", "UNIQUE", "IDENTIFICATION", "AUTHORITY"],
                        "description": "Text extracted from the ID card"
                    },
                    "processing_time": {
                        "type": "number",
                        "example": 2.3,
                        "description": "Processing time in seconds"
                    },
                    "image_quality": {
                        "type": "object",
                        "properties": {
                            "resolution": {"type": "string", "example": "1920x1080"},
                            "clarity_score": {"type": "number", "example": 0.88},
                            "text_readability": {"type": "number", "example": 0.92}
                        }
                    }
                }
            }
        },
        "400": {
            "description": "Invalid image or processing error",
            "schema": {
                "type": "object",
                "properties": {
                    "error": {"type": "string", "example": "Invalid image format"},
                    "supported_formats": {
                        "type": "array",
                        "items": {"type": "string"},
                        "example": ["jpg", "jpeg", "png", "bmp"]
                    }
                }
            }
        }
    }
}

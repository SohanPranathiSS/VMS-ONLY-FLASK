# API Documentation

## Overview
This directory contains API documentation for the Visitor Management System.

## Endpoints

### Authentication API
- **POST** `/api/auth/login` - User login
- **POST** `/api/auth/register` - User registration
- **GET** `/api/auth/verify` - Token verification
- **POST** `/api/auth/logout` - User logout

### Visitor Management API
- **GET** `/api/visitors` - Get visitors list
- **POST** `/api/visitors` - Create new visitor
- **GET** `/api/visitors/:id` - Get specific visitor
- **PUT** `/api/visitors/:id` - Update visitor
- **DELETE** `/api/visitors/:id` - Delete visitor

### Admin API
- **GET** `/api/admin/dashboard` - Admin dashboard data
- **GET** `/api/admin/reports` - Generate reports
- **POST** `/api/admin/blacklist` - Manage blacklist
- **GET** `/api/admin/users` - Manage users

### ML Service API
- **POST** `/ml/extract-id-number` - Extract ID from image
- **POST** `/ml/upload` - Upload and process image

## Authentication
All API endpoints (except login/register) require JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
All API responses follow this format:
```json
{
  "success": true,
  "data": {},
  "error": null
}
```

## Error Codes
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **500** - Internal Server Error

## Rate Limiting
- **General endpoints:** 100 requests per minute
- **Authentication endpoints:** 10 requests per minute
- **File upload endpoints:** 5 requests per minute

-- Initial Database Schema Migration
-- Created: 2025-08-05
-- Description: Creates the initial database schema for Visitor Management System

-- Begin transaction
START TRANSACTION;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    phone VARCHAR(20),
    role ENUM('admin', 'host', 'security', 'visitor') DEFAULT 'visitor',
    department VARCHAR(100),
    employee_id VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create visitors table
CREATE TABLE IF NOT EXISTS visitors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    visitor_type ENUM('guest', 'contractor', 'vendor', 'interview') DEFAULT 'guest',
    company VARCHAR(100),
    purpose_of_visit TEXT,
    id_type ENUM('drivers_license', 'passport', 'national_id', 'other'),
    id_number VARCHAR(50),
    photo_path VARCHAR(255),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create hosts table
CREATE TABLE IF NOT EXISTS hosts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    office_location VARCHAR(100),
    extension VARCHAR(20),
    notification_preferences JSON,
    max_concurrent_visitors INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create visits table
CREATE TABLE IF NOT EXISTS visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_id INT NOT NULL,
    host_id INT NOT NULL,
    purpose TEXT,
    scheduled_start DATETIME,
    scheduled_end DATETIME,
    actual_start DATETIME,
    actual_end DATETIME,
    status ENUM('scheduled', 'checked_in', 'checked_out', 'cancelled', 'no_show') DEFAULT 'scheduled',
    visitor_count INT DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE,
    FOREIGN KEY (host_id) REFERENCES hosts(id) ON DELETE CASCADE
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('visit_scheduled', 'visitor_arrived', 'visit_reminder', 'system_alert') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    metadata JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    data_type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, data_type, description, is_public) VALUES
('site_name', 'Visitor Management System', 'string', 'Name of the organization', TRUE),
('max_visit_duration', '8', 'integer', 'Maximum visit duration in hours', TRUE),
('advance_booking_days', '30', 'integer', 'Maximum days in advance for booking', TRUE),
('enable_photo_capture', 'true', 'boolean', 'Enable visitor photo capture', TRUE),
('enable_id_scanning', 'true', 'boolean', 'Enable ID document scanning', TRUE),
('notification_email', 'admin@company.com', 'string', 'System notification email', FALSE),
('security_settings', '{"password_min_length": 8, "require_2fa": false}', 'json', 'Security configuration', FALSE);

-- Create user sessions table for JWT blacklist
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_jti VARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Commit transaction
COMMIT;

-- Migration completion log
INSERT INTO migration_log (migration_name, applied_at, status) 
VALUES ('2025_08_05_000001_initial_schema', NOW(), 'completed')
ON DUPLICATE KEY UPDATE applied_at = NOW(), status = 'completed';

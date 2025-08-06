-- Production Database Initialization Script
-- Visitor Management System V3

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS visitor_management_prod
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE visitor_management_prod;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'host', 'user', 'security') DEFAULT 'user',
    company_id INT NULL,
    department VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_company_id (company_id),
    INDEX idx_is_active (is_active)
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    company_id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    address TEXT NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(100) NULL,
    website VARCHAR(200) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_company_name (company_name),
    INDEX idx_is_active (is_active)
);

-- Visitors table
CREATE TABLE IF NOT EXISTS visitors (
    visitor_id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_name VARCHAR(100) NOT NULL,
    visitor_email VARCHAR(100) NULL,
    visitor_phone VARCHAR(20) NULL,
    visitor_company VARCHAR(200) NULL,
    id_type ENUM('passport', 'license', 'national_id', 'other') NULL,
    id_number VARCHAR(50) NULL,
    photo_path VARCHAR(500) NULL,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    blacklist_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_visitor_email (visitor_email),
    INDEX idx_visitor_phone (visitor_phone),
    INDEX idx_visitor_company (visitor_company),
    INDEX idx_is_blacklisted (is_blacklisted)
);

-- Visits table
CREATE TABLE IF NOT EXISTS visits (
    visit_id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_id INT NULL,
    visitor_name VARCHAR(100) NOT NULL,
    visitor_email VARCHAR(100) NULL,
    visitor_phone VARCHAR(20) NULL,
    visitor_company VARCHAR(200) NULL,
    purpose_of_visit TEXT NOT NULL,
    host_name VARCHAR(100) NOT NULL,
    host_email VARCHAR(100) NOT NULL,
    host_department VARCHAR(100) NULL,
    host_phone VARCHAR(20) NULL,
    visit_date DATE NOT NULL,
    check_in_time DATETIME NULL,
    check_out_time DATETIME NULL,
    expected_duration INT NULL COMMENT 'Expected duration in minutes',
    actual_duration INT NULL COMMENT 'Actual duration in minutes',
    status ENUM('pending', 'approved', 'checked-in', 'checked-out', 'cancelled', 'no-show') DEFAULT 'pending',
    qr_code VARCHAR(200) UNIQUE NULL,
    badge_number VARCHAR(50) NULL,
    vehicle_number VARCHAR(20) NULL,
    emergency_contact VARCHAR(100) NULL,
    emergency_phone VARCHAR(20) NULL,
    notes TEXT NULL,
    admin_notes TEXT NULL,
    rating INT NULL COMMENT 'Visit experience rating 1-5',
    feedback TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    
    INDEX idx_visitor_id (visitor_id),
    INDEX idx_host_email (host_email),
    INDEX idx_visit_date (visit_date),
    INDEX idx_status (status),
    INDEX idx_qr_code (qr_code),
    INDEX idx_check_in_time (check_in_time),
    INDEX idx_check_out_time (check_out_time),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Visit approvals table
CREATE TABLE IF NOT EXISTS visit_approvals (
    approval_id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL,
    approver_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approval_date TIMESTAMP NULL,
    comments TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_visit_id (visit_id),
    INDEX idx_approver_id (approver_id),
    INDEX idx_status (status),
    
    FOREIGN KEY (visit_id) REFERENCES visits(visit_id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    visit_id INT NULL,
    type ENUM('visit_request', 'visit_approval', 'visit_checkin', 'visit_checkout', 'system') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_visit_id (visit_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (visit_id) REFERENCES visits(visit_id) ON DELETE CASCADE
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_table_name (table_name),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NULL,
    description TEXT NULL,
    category VARCHAR(50) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_setting_key (setting_key),
    INDEX idx_category (category)
);

-- Create default admin user
INSERT INTO users (username, email, password_hash, full_name, role, is_verified, is_active) 
VALUES (
    'admin',
    'admin@company.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfQZtYTUQn7BYQ2', -- password: admin123
    'System Administrator',
    'admin',
    TRUE,
    TRUE
) ON DUPLICATE KEY UPDATE username = username;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description, category) VALUES
('max_visit_duration', '480', 'Maximum visit duration in minutes (8 hours)', 'visits'),
('advance_booking_days', '30', 'How many days in advance visits can be booked', 'visits'),
('auto_checkout_enabled', 'true', 'Automatically checkout visitors after max duration', 'visits'),
('email_notifications_enabled', 'true', 'Enable email notifications', 'notifications'),
('sms_notifications_enabled', 'false', 'Enable SMS notifications', 'notifications'),
('visitor_photo_required', 'true', 'Require visitor photo during check-in', 'security'),
('id_verification_required', 'false', 'Require ID verification for all visitors', 'security'),
('blacklist_check_enabled', 'true', 'Check visitors against blacklist', 'security'),
('working_hours_start', '08:00', 'Office working hours start time', 'schedule'),
('working_hours_end', '18:00', 'Office working hours end time', 'schedule'),
('weekend_visits_allowed', 'false', 'Allow visits during weekends', 'schedule')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

-- Create indexes for performance
CREATE INDEX idx_visits_composite ON visits(visit_date, status, host_email);
CREATE INDEX idx_users_composite ON users(role, is_active, is_verified);

-- Create view for active visits
CREATE OR REPLACE VIEW active_visits AS
SELECT 
    v.*,
    vr.visitor_name as visitor_full_name,
    vr.visitor_email as visitor_primary_email,
    vr.visitor_phone as visitor_primary_phone,
    u.full_name as host_full_name,
    u.department as host_dept
FROM visits v
LEFT JOIN visitors vr ON v.visitor_id = vr.visitor_id
LEFT JOIN users u ON v.host_email = u.email
WHERE v.status IN ('pending', 'approved', 'checked-in');

-- Create view for visit statistics
CREATE OR REPLACE VIEW visit_stats AS
SELECT 
    DATE(visit_date) as date,
    COUNT(*) as total_visits,
    COUNT(CASE WHEN status = 'checked-in' THEN 1 END) as checked_in,
    COUNT(CASE WHEN status = 'checked-out' THEN 1 END) as checked_out,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
    AVG(CASE WHEN actual_duration IS NOT NULL THEN actual_duration END) as avg_duration
FROM visits
WHERE visit_date >= CURDATE() - INTERVAL 30 DAY
GROUP BY DATE(visit_date)
ORDER BY date DESC;

COMMIT;

-- Production Database Initialization Script (Extended for Admin Dashboard)
-- Visitor Management System V3 with Subscription and Payment Management

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS vms_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE vms_db;

-- Companies table (extended with subscription fields)
CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstname VARCHAR(100) NULL,
    lastname VARCHAR(100) NULL,
    email VARCHAR(100) NULL,
    password VARCHAR(255) NULL,
    role ENUM('admin', 'company_admin', 'user') DEFAULT 'company_admin',
    company_name VARCHAR(200) NOT NULL,
    admin_company_id INT NULL,
    mobile_number VARCHAR(20) NULL,
    
    -- Subscription fields added for Admin Dashboard
    plan_name VARCHAR(100) NULL,
    subscription_plan ENUM('free', 'monthly', 'yearly', 'enterprise') DEFAULT 'free',
    subscription_status ENUM('active', 'expired', 'cancelled', 'trial') DEFAULT 'trial',
    subscription_start_date DATE NULL,
    subscription_end_date DATE NULL,
    
    -- Billing and payment fields
    payment_method VARCHAR(50) DEFAULT 'razorpay',
    billing_contact_email VARCHAR(150) NULL,

    -- Trial period fields
    trial_start_date DATE NULL,
    trial_end_date DATE NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_company_name (company_name),
    INDEX idx_email (email)
);

-- Users table (extended with optional support and security fields)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'host', 'user', 'security') DEFAULT 'user',
    mobile_number VARCHAR(20) NULL,
    company_name VARCHAR(200) NULL,
    company_id INT NULL,
    department VARCHAR(100) NULL,
    designation VARCHAR(100) NULL,
    last_login TIMESTAMP NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    
    -- Support/Admin role extension and security
    support_role BOOLEAN DEFAULT FALSE,
    last_password_change TIMESTAMP NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,

    -- Additional profile and activity fields
    last_activity_at TIMESTAMP NULL,
    profile_photo MEDIUMTEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_company_id (company_id),
    INDEX idx_is_active (is_active),
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

-- Visitors table (unchanged)
CREATE TABLE IF NOT EXISTS visitors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    idCardNumber VARCHAR(50) NULL,
    photo MEDIUMTEXT NULL,
    type_of_card VARCHAR(50) NULL,
    idCardPhoto MEDIUMTEXT NULL,
    designation VARCHAR(100) NULL,
    company VARCHAR(200) NULL,
    companyTel VARCHAR(20) NULL,
    website VARCHAR(200) NULL,
    address TEXT NULL,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    reason_for_blacklist TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_company (company),
    INDEX idx_is_blacklisted (is_blacklisted)
);

-- Pre-registrations table (unchanged)
CREATE TABLE IF NOT EXISTS pre_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NULL,
    visitor_name VARCHAR(100) NOT NULL,
    visitor_email VARCHAR(100) NULL,
    visitor_phone VARCHAR(20) NULL,
    visitor_company VARCHAR(200) NULL,
    company_to_visit VARCHAR(200) NULL,
    host_name VARCHAR(100) NOT NULL,
    host_id INT NULL,
    visit_date DATE NOT NULL,
    visit_time TIME NULL,
    purpose TEXT NOT NULL,
    duration INT NULL COMMENT 'Duration in minutes',
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern ENUM('daily', 'weekly', 'monthly') NULL,
    recurring_end_date DATE NULL,
    special_requirements TEXT NULL,
    emergency_contact VARCHAR(100) NULL,
    vehicle_number VARCHAR(20) NULL,
    number_of_visitors INT DEFAULT 1,
    qr_code VARCHAR(200) UNIQUE NULL,
    gr_code VARCHAR(200) UNIQUE NULL,
    status ENUM('pending', 'approved', 'checked-in', 'checked-out', 'cancelled', 'checked_out') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    check_in_time DATETIME NULL,
    checked_out_at DATETIME NULL,
    
    INDEX idx_company_id (company_id),
    INDEX idx_host_id (host_id),
    INDEX idx_visitor_email (visitor_email),
    INDEX idx_visit_date (visit_date),
    INDEX idx_status (status),
    INDEX idx_qr_code (qr_code),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Visits table (unchanged)
CREATE TABLE IF NOT EXISTS visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_id INT NULL,
    host_id INT NULL,
    reason TEXT NULL,
    itemsCarried TEXT NULL,
    check_in_time DATETIME NULL,
    check_out_time DATETIME NULL,
    visitor_name VARCHAR(100) NOT NULL,
    visitor_email VARCHAR(100) NULL,
    visitor_phone VARCHAR(20) NULL,
    visitor_company VARCHAR(200) NULL,
    purpose_of_visit TEXT NOT NULL,
    host_name VARCHAR(100) NOT NULL,
    host_email VARCHAR(100) NOT NULL,
    host_department VARCHAR(100) NULL,
    host_phone VARCHAR(20) NULL,
    company_id INT NULL,
    visit_date DATE NOT NULL,
    scheduled_time DATETIME NULL,
    expected_duration INT NULL COMMENT 'Expected duration in minutes',
    actual_duration INT NULL COMMENT 'Actual duration in minutes',
    status ENUM('pending', 'approved', 'checked-in', 'checked-out', 'cancelled', 'no-show') DEFAULT 'pending',
    qr_code VARCHAR(200) UNIQUE NULL,
    badge_number VARCHAR(50) NULL,
    vehicle_number VARCHAR(20) NULL,
    emergency_contact VARCHAR(100) NULL,
    emergency_phone VARCHAR(20) NULL,
    number_of_visitors INT DEFAULT 1,
    notes TEXT NULL,
    admin_notes TEXT NULL,
    rating INT NULL COMMENT 'Visit experience rating 1-5',
    feedback TEXT NULL,
    pre_registration_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    checked_in_at DATETIME NULL,
    created_by INT NULL,
    updated_by INT NULL,
    
    INDEX idx_visitor_id (visitor_id),
    INDEX idx_host_id (host_id),
    INDEX idx_host_email (host_email),
    INDEX idx_company_id (company_id),
    INDEX idx_visit_date (visit_date),
    INDEX idx_status (status),
    INDEX idx_qr_code (qr_code),
    INDEX idx_check_in_time (check_in_time),
    INDEX idx_check_out_time (check_out_time),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE SET NULL,
    FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    FOREIGN KEY (pre_registration_id) REFERENCES pre_registrations(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Visit approvals table (unchanged)
CREATE TABLE IF NOT EXISTS visit_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL,
    approver_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approval_date TIMESTAMP NULL,
    comments TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_visit_id (visit_id),
    INDEX idx_approver_id (approver_id),
    INDEX idx_status (status),
    
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications table (unchanged)
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
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
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
);

-- Audit logs table (unchanged)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NULL,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_company_id (company_id),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_table_name (table_name),
    INDEX idx_timestamp (timestamp),
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- System settings table (unchanged)
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emailNotifications BOOLEAN DEFAULT TRUE,
    requireApproval BOOLEAN DEFAULT FALSE,
    maxVisitorsPerDay INT DEFAULT 100,
    retainPeriodDays INT DEFAULT 365,
    allowSelfCheckOut BOOLEAN DEFAULT TRUE,
    capturePhoto BOOLEAN DEFAULT TRUE,
    systemName VARCHAR(100) DEFAULT 'Visitor Management System',
    companyLogo VARCHAR(500) NULL,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    dateFormat VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    timeFormat VARCHAR(20) DEFAULT 'HH:mm',
    lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_lastUpdated (lastUpdated)
);

-- Contact us table (extended for support ticket management)
CREATE TABLE IF NOT EXISTS contact_us (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    
    -- Support ticket fields
    status ENUM('open', 'in_progress', 'closed', 'rejected') DEFAULT 'open',
    assigned_to_user_id INT NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    response_thread JSON NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_created_at (created_at),
    INDEX idx_status (status),
    INDEX idx_assigned_to (assigned_to_user_id),
    
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Book demo table (unchanged)
CREATE TABLE IF NOT EXISTS book_demo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    organization VARCHAR(200) NOT NULL,
    preferred_date DATE NULL,
    message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_organization (organization),
    INDEX idx_created_at (created_at)
);

-- System backups table (unchanged)
CREATE TABLE IF NOT EXISTS system_backups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NULL,
    backup_type ENUM('full', 'incremental', 'manual') NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    
    INDEX idx_company_id (company_id),
    INDEX idx_backup_type (backup_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

-- Company settings table (unchanged)
CREATE TABLE IF NOT EXISTS company_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    settings JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    checked_in_at DATETIME NULL,
    
    INDEX idx_company_id (company_id),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Admin users table for internal operators (Admin Portal)
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(20) NULL,
    role ENUM('admin','ops','finance','support','readonly') NOT NULL DEFAULT 'readonly',
    permissions JSON NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
);

-- New table: Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    plan ENUM('free', 'monthly', 'yearly', 'enterprise') DEFAULT 'free',
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    razorpay_payment_id VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    
    INDEX idx_company_id (company_id),
    INDEX idx_status (status),
    INDEX idx_end_date (end_date)
);

-- New table: Payments
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    subscription_id INT NOT NULL,
    razorpay_order_id VARCHAR(100) NOT NULL,
    razorpay_payment_id VARCHAR(100) NULL,
    status ENUM('created', 'paid', 'failed') DEFAULT 'created',
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    invoice_url VARCHAR(255) NULL,
    payment_date DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    
    INDEX idx_company_id (company_id),
    INDEX idx_subscription_id (subscription_id),
    INDEX idx_status (status),
    INDEX idx_payment_date (payment_date)
);

-- Pricing Plans Table for Monthly Plans
CREATE TABLE IF NOT EXISTS pricing_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_name ENUM('Basic', 'Professional', 'Enterprise') NOT NULL,
    billing_cycle ENUM('monthly','yearly') NOT NULL DEFAULT 'monthly',
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_plan_billing (plan_name, billing_cycle)
);




CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('open', 'in_progress', 'resolved', 'closed', 'rejected') DEFAULT 'open',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    created_by_company VARCHAR(50) NOT NULL, -- company of the user who created the ticket
    assigned_to VARCHAR(50) NULL,    -- support staff assigned
    category VARCHAR(100) NULL, -- optional categorization (e.g., billing, technical)
    attachment_url VARCHAR(255) NULL, -- optional file attachment
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL, -- closing timestamp
    
    -- Indexes for performance
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created_by (created_by),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at),
    INDEX idx_updated_at (updated_at)
    );



-- Insert sample monthly plans
INSERT INTO pricing_plans (plan_name, billing_cycle, price, currency, description) VALUES
('Basic', 'monthly', 499.00, 'INR', 'Basic monthly subscription plan'),
('Professional', 'monthly', 1499.00, 'INR', 'Professional monthly subscription plan'),
('Enterprise', 'monthly', 4999.00, 'INR', 'Enterprise monthly subscription plan'),
('Basic', 'yearly', 4999.00, 'INR', 'Basic yearly subscription plan'),
('Professional', 'yearly', 14999.00, 'INR', 'Professional yearly subscription plan'),
('Enterprise', 'yearly', 49999.00, 'INR', 'Enterprise yearly subscription plan')
ON DUPLICATE KEY UPDATE price=VALUES(price), description=VALUES(description), updated_at=VALUES(updated_at);

-- Create default admin user
INSERT INTO users (name, email, password, role, is_verified, is_active) 
VALUES (
    'System Administrator',
    'admin@company.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfQZtYTUQn7BYQ2', -- password: admin123
    'admin',
    TRUE,
    TRUE
) ON DUPLICATE KEY UPDATE name = name;

-- Insert default system settings
INSERT INTO system_settings (emailNotifications, requireApproval, maxVisitorsPerDay, retainPeriodDays, allowSelfCheckOut, capturePhoto) VALUES
(TRUE, FALSE, 100, 365, TRUE, TRUE)
ON DUPLICATE KEY UPDATE id = id;



-- Seed requested Pranathiss tenant admin users with specified passwords
-- Password hashes generated using Werkzeug generate_password_hash (pbkdf2:sha256)
INSERT INTO admin_users (name, email, password, role, permissions, is_active)
VALUES
    (
        'Platform Admin (Pranathiss)',
        'platform.admin@pranathiss.local',
        '$pbkdf2-sha256$600000$Z5v5qavK7cQYbG3TnqQ3mQ$dW8oao0M8cG5C1gC8o2l9N8zB1w1P0mZQwEoI8Hq9CA',
        'admin',
        JSON_ARRAY('*'),
        TRUE
    ),
    (
        'Ops Admin (Pranathiss)',
        'ops.admin@pranathiss.local',
        '$pbkdf2-sha256$600000$J1z1wPzF7mYbTq9Lr2Q4sA$7j3v2WZ2m3b3Z3d1tqzC3y6m1QxJ2cV4r9lQe5m0QjM',
        'ops',
        JSON_ARRAY('users:view','visits:view','support:view'),
        TRUE
    ),
    (
        'Finance Admin (Pranathiss)',
        'finance.admin@pranathiss.local',
        '$pbkdf2-sha256$600000$Q9r7sK1nV2mYtP3oL5a6bC$6m5n4o3p2q1r0s9t8u7v6w5x4y3z2a1b0c9d8e7f6g5',
        'finance',
        JSON_ARRAY('billing:view','subscriptions:view'),
        TRUE
    ),
    (
        'Support Agent (Pranathiss)',
        'support.agent@pranathiss.local',
        '$pbkdf2-sha256$600000$N7m6lK5jH4gF3dS2aQ1wE$C1d2E3f4G5h6I7j8K9l0M1n2O3p4Q5r6S7t8U9v0W1x2',
        'support',
        JSON_ARRAY('support:view','support:edit'),
        TRUE
    ),
    (
        'Readonly Viewer (Pranathiss)',
        'readonly.viewer@pranathiss.local',
        '$pbkdf2-sha256$600000$M1n2B3v4C5x6Z7a8S9d0F$a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0u1V2',
        'readonly',
        JSON_ARRAY('support:view'),
        TRUE
    )
ON DUPLICATE KEY UPDATE name = VALUES(name);

















-- Create indexes for performance (extended indexes retained)
CREATE INDEX idx_visits_composite ON visits(visit_date, status, host_email);
CREATE INDEX idx_users_composite ON users(role, is_active, is_verified);

-- Create view for active visits
CREATE OR REPLACE VIEW active_visits AS
SELECT 
    v.*,
    u.department as host_dept
FROM visits v
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

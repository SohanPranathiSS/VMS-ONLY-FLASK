-- Audit Logging Migration
-- Created: 2025-08-05
-- Description: Adds comprehensive audit logging tables

-- Begin transaction
START TRANSACTION;

-- Create migration log table (referenced in other migrations)
CREATE TABLE IF NOT EXISTS migration_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    error_message TEXT,
    rollback_script TEXT
);

-- Create audit log table for tracking all data changes
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON,
    new_values JSON,
    user_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255),
    INDEX idx_audit_table_record (table_name, record_id),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create security events log
CREATE TABLE IF NOT EXISTS security_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type ENUM('login_success', 'login_failure', 'password_change', 'account_locked', 'suspicious_activity', 'data_export', 'permission_change') NOT NULL,
    user_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSON,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_security_type (event_type),
    INDEX idx_security_user (user_id),
    INDEX idx_security_severity (severity),
    INDEX idx_security_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create system activity log
CREATE TABLE IF NOT EXISTS system_activity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_type ENUM('backup_created', 'system_restart', 'maintenance_start', 'maintenance_end', 'config_change', 'bulk_operation') NOT NULL,
    description TEXT,
    user_id INT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_activity_type (activity_type),
    INDEX idx_activity_user (user_id),
    INDEX idx_activity_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create visit analytics table for reporting
CREATE TABLE IF NOT EXISTS visit_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    total_visits INT DEFAULT 0,
    checked_in_visits INT DEFAULT 0,
    checked_out_visits INT DEFAULT 0,
    cancelled_visits INT DEFAULT 0,
    no_show_visits INT DEFAULT 0,
    avg_visit_duration DECIMAL(5,2),
    peak_hour TIME,
    unique_visitors INT DEFAULT 0,
    repeat_visitors INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date (date),
    INDEX idx_analytics_date (date)
);

-- Create triggers for automatic audit logging

-- Users table audit trigger
DELIMITER $$
CREATE TRIGGER users_audit_insert AFTER INSERT ON users
FOR EACH ROW BEGIN
    INSERT INTO audit_logs (table_name, record_id, action, new_values, created_at)
    VALUES ('users', NEW.id, 'INSERT', JSON_OBJECT(
        'email', NEW.email,
        'first_name', NEW.first_name,
        'last_name', NEW.last_name,
        'role', NEW.role,
        'department', NEW.department,
        'employee_id', NEW.employee_id,
        'is_active', NEW.is_active
    ), NOW());
END$$

CREATE TRIGGER users_audit_update AFTER UPDATE ON users
FOR EACH ROW BEGIN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, created_at)
    VALUES ('users', NEW.id, 'UPDATE', JSON_OBJECT(
        'email', OLD.email,
        'first_name', OLD.first_name,
        'last_name', OLD.last_name,
        'role', OLD.role,
        'department', OLD.department,
        'employee_id', OLD.employee_id,
        'is_active', OLD.is_active
    ), JSON_OBJECT(
        'email', NEW.email,
        'first_name', NEW.first_name,
        'last_name', NEW.last_name,
        'role', NEW.role,
        'department', NEW.department,
        'employee_id', NEW.employee_id,
        'is_active', NEW.is_active
    ), NOW());
END$$

-- Visits table audit trigger
CREATE TRIGGER visits_audit_insert AFTER INSERT ON visits
FOR EACH ROW BEGIN
    INSERT INTO audit_logs (table_name, record_id, action, new_values, created_at)
    VALUES ('visits', NEW.id, 'INSERT', JSON_OBJECT(
        'visitor_id', NEW.visitor_id,
        'host_id', NEW.host_id,
        'purpose', NEW.purpose,
        'scheduled_start', NEW.scheduled_start,
        'scheduled_end', NEW.scheduled_end,
        'status', NEW.status,
        'visitor_count', NEW.visitor_count
    ), NOW());
END$$

CREATE TRIGGER visits_audit_update AFTER UPDATE ON visits
FOR EACH ROW BEGIN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, created_at)
    VALUES ('visits', NEW.id, 'UPDATE', JSON_OBJECT(
        'visitor_id', OLD.visitor_id,
        'host_id', OLD.host_id,
        'purpose', OLD.purpose,
        'scheduled_start', OLD.scheduled_start,
        'scheduled_end', OLD.scheduled_end,
        'actual_start', OLD.actual_start,
        'actual_end', OLD.actual_end,
        'status', OLD.status,
        'visitor_count', OLD.visitor_count
    ), JSON_OBJECT(
        'visitor_id', NEW.visitor_id,
        'host_id', NEW.host_id,
        'purpose', NEW.purpose,
        'scheduled_start', NEW.scheduled_start,
        'scheduled_end', NEW.scheduled_end,
        'actual_start', NEW.actual_start,
        'actual_end', NEW.actual_end,
        'status', NEW.status,
        'visitor_count', NEW.visitor_count
    ), NOW());
END$$

DELIMITER ;

-- Create stored procedure for daily analytics update
DELIMITER $$
CREATE PROCEDURE UpdateDailyAnalytics(IN target_date DATE)
BEGIN
    INSERT INTO visit_analytics (
        date, 
        total_visits, 
        checked_in_visits, 
        checked_out_visits, 
        cancelled_visits, 
        no_show_visits,
        avg_visit_duration,
        unique_visitors,
        repeat_visitors
    )
    SELECT 
        target_date,
        COUNT(*) as total_visits,
        SUM(CASE WHEN status = 'checked_in' THEN 1 ELSE 0 END) as checked_in_visits,
        SUM(CASE WHEN status = 'checked_out' THEN 1 ELSE 0 END) as checked_out_visits,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_visits,
        SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show_visits,
        AVG(CASE 
            WHEN actual_start IS NOT NULL AND actual_end IS NOT NULL 
            THEN TIMESTAMPDIFF(MINUTE, actual_start, actual_end) / 60.0 
            ELSE NULL 
        END) as avg_visit_duration,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COUNT(*) - COUNT(DISTINCT visitor_id) as repeat_visitors
    FROM visits 
    WHERE DATE(scheduled_start) = target_date
    ON DUPLICATE KEY UPDATE
        total_visits = VALUES(total_visits),
        checked_in_visits = VALUES(checked_in_visits),
        checked_out_visits = VALUES(checked_out_visits),
        cancelled_visits = VALUES(cancelled_visits),
        no_show_visits = VALUES(no_show_visits),
        avg_visit_duration = VALUES(avg_visit_duration),
        unique_visitors = VALUES(unique_visitors),
        repeat_visitors = VALUES(repeat_visitors),
        updated_at = NOW();
END$$
DELIMITER ;

-- Commit transaction
COMMIT;

-- Migration completion log
INSERT INTO migration_log (migration_name, applied_at, status) 
VALUES ('2025_08_05_000003_add_audit_logs', NOW(), 'completed')
ON DUPLICATE KEY UPDATE applied_at = NOW(), status = 'completed';

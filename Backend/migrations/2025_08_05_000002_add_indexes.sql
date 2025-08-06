-- Performance Indexes Migration
-- Created: 2025-08-05
-- Description: Adds performance indexes for optimized queries

-- Begin transaction
START TRANSACTION;

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Visitors table indexes
CREATE INDEX idx_visitors_user_id ON visitors(user_id);
CREATE INDEX idx_visitors_type ON visitors(visitor_type);
CREATE INDEX idx_visitors_company ON visitors(company);
CREATE INDEX idx_visitors_id_number ON visitors(id_number);
CREATE INDEX idx_visitors_created_at ON visitors(created_at);

-- Hosts table indexes
CREATE INDEX idx_hosts_user_id ON hosts(user_id);
CREATE INDEX idx_hosts_location ON hosts(office_location);

-- Visits table indexes
CREATE INDEX idx_visits_visitor_id ON visits(visitor_id);
CREATE INDEX idx_visits_host_id ON visits(host_id);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_scheduled_start ON visits(scheduled_start);
CREATE INDEX idx_visits_scheduled_end ON visits(scheduled_end);
CREATE INDEX idx_visits_actual_start ON visits(actual_start);
CREATE INDEX idx_visits_actual_end ON visits(actual_end);
CREATE INDEX idx_visits_created_at ON visits(created_at);

-- Composite indexes for common queries
CREATE INDEX idx_visits_status_date ON visits(status, scheduled_start);
CREATE INDEX idx_visits_host_status ON visits(host_id, status);
CREATE INDEX idx_visits_visitor_status ON visits(visitor_id, status);
CREATE INDEX idx_visits_date_range ON visits(scheduled_start, scheduled_end);

-- Notifications table indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);

-- System settings indexes
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX idx_system_settings_public ON system_settings(is_public);

-- User sessions indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(token_jti);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Full-text search indexes for better search performance
ALTER TABLE visitors ADD FULLTEXT(company, purpose_of_visit);
ALTER TABLE visits ADD FULLTEXT(purpose, notes);

-- Commit transaction
COMMIT;

-- Migration completion log
INSERT INTO migration_log (migration_name, applied_at, status) 
VALUES ('2025_08_05_000002_add_indexes', NOW(), 'completed')
ON DUPLICATE KEY UPDATE applied_at = NOW(), status = 'completed';

-- Create test users for MySQL database
-- Password for all users: password
-- Hash generated with bcrypt for 'password'

USE mawebtec_lms;

-- Delete existing test users if they exist
DELETE FROM users WHERE email IN ('admin@example.com', 'test@example.com', 'accountant@example.com', 'sales@example.com');

-- Insert admin user (email: admin@example.com, password: password)
INSERT INTO users (email, password_hash, username, role, is_active, created_at, updated_at) VALUES 
('admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin', 1, NOW(), NOW());

-- Insert test user (email: test@example.com, password: password)
INSERT INTO users (email, password_hash, username, role, is_active, created_at, updated_at) VALUES 
('test@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test User', 'admin', 1, NOW(), NOW());

-- Insert accountant user (email: accountant@example.com, password: password)
INSERT INTO users (email, password_hash, username, role, is_active, created_at, updated_at) VALUES 
('accountant@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Chief Accountant', 'accountant', 1, NOW(), NOW());

-- Insert sales user (email: sales@example.com, password: password)
INSERT INTO users (email, password_hash, username, role, is_active, created_at, updated_at) VALUES 
('sales@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sales Manager', 'sales', 1, NOW(), NOW());

-- Verify users were created
SELECT id, email, username, role, is_active FROM users WHERE email IN ('admin@example.com', 'test@example.com', 'accountant@example.com', 'sales@example.com');

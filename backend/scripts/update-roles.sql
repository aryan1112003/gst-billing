-- Update roles to match the old system: admin, agency, user
USE mawebtec_lms;

-- First, update the users table to allow the new roles
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'agency', 'user', 'accountant', 'sales') DEFAULT 'user';

-- Update existing users to use the new role names
UPDATE users SET role = 'admin' WHERE role IN ('admin', 'accountant', 'sales');

-- Now change the ENUM to only have the 3 roles
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'agency', 'user') DEFAULT 'user';

-- Delete old test users and create new ones with correct roles
DELETE FROM users WHERE email IN ('admin@example.com', 'test@example.com', 'accountant@example.com', 'sales@example.com');

-- Insert users with the 3 roles (password: password)
INSERT INTO users (email, password_hash, username, role, is_active, created_at, updated_at) VALUES 
('admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin', 1, NOW(), NOW()),
('agency@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Agency User', 'agency', 1, NOW(), NOW()),
('user@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Regular User', 'user', 1, NOW(), NOW());

-- Verify users
SELECT id, email, username, role, is_active FROM users WHERE email IN ('admin@example.com', 'agency@example.com', 'user@example.com');

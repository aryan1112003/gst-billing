-- Create Test Users for Testing
-- Run this script to create test users with known credentials

USE mawebtec_lms;

-- Delete existing test users if they exist
DELETE FROM users WHERE email IN ('admin@test.com', 'agency@test.com', 'user@test.com');

-- Create admin user
-- Username: admin
-- Email: admin@test.com
-- Password: admin123
-- Role: admin
INSERT INTO users (username, email, password_hash, role, is_active, created_at, updated_at) 
VALUES (
  'admin', 
  'admin@test.com', 
  '$2a$10$YourHashedPasswordHere',
  'admin', 
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Create agency user
-- Username: agency
-- Email: agency@test.com
-- Password: agency123
-- Role: agency
INSERT INTO users (username, email, password_hash, role, is_active, created_at, updated_at) 
VALUES (
  'agency', 
  'agency@test.com', 
  '$2a$10$YourHashedPasswordHere',
  'agency', 
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Create regular user
-- Username: user
-- Email: user@test.com
-- Password: user123
-- Role: user
INSERT INTO users (username, email, password_hash, role, is_active, created_at, updated_at) 
VALUES (
  'user', 
  'user@test.com', 
  '$2a$10$YourHashedPasswordHere',
  'user', 
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Verify users were created
SELECT id, username, email, role, is_active FROM users WHERE email LIKE '%@test.com';

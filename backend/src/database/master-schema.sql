-- ============================================================================
-- MASTER DATABASE SCHEMA
-- This is the central database that manages all agencies and users
-- ============================================================================

-- Agencies table (stores all agencies/tenants)
CREATE TABLE IF NOT EXISTS agencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  database_name VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) DEFAULT NULL,
  address TEXT,
  gst_number VARCHAR(50) DEFAULT NULL,
  pan_number VARCHAR(50) DEFAULT NULL,
  logo_url VARCHAR(500) DEFAULT NULL,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  subscription_plan VARCHAR(50) DEFAULT 'basic',
  subscription_expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_database_name (database_name),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table (stores all users across all agencies)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(128) DEFAULT NULL,
  name VARCHAR(255) DEFAULT NULL,
  password VARCHAR(255) DEFAULT NULL,
  password_hash VARCHAR(255) DEFAULT NULL,
  mobile VARCHAR(20) DEFAULT NULL,
  roleId INT DEFAULT 3,
  role VARCHAR(50) DEFAULT 'user',
  agency_id INT DEFAULT NULL,
  is_active INT DEFAULT 1,
  createdBy INT DEFAULT NULL,
  createdDtm DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedBy INT DEFAULT NULL,
  updatedDtm DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_agency_id (agency_id),
  INDEX idx_role (role),
  INDEX idx_is_active (is_active),
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System audit logs (master level)
CREATE TABLE IF NOT EXISTS system_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  agency_id INT DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) DEFAULT NULL,
  entity_id INT DEFAULT NULL,
  details TEXT,
  ip_address VARCHAR(50) DEFAULT NULL,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_agency_id (agency_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default system admin (password: admin123)
INSERT INTO users (email, username, name, password_hash, roleId, role, is_active) 
VALUES (
  'admin@system.com',
  'admin',
  'System Administrator',
  '$2a$10$rZ5qYqQxJxqXqYqQxJxqXeO5qYqQxJxqXqYqQxJxqXqYqQxJxqXqY',
  1,
  'admin',
  1
) ON DUPLICATE KEY UPDATE id=id;

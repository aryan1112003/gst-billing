-- Create missing tables in master database

-- Agencies table
CREATE TABLE IF NOT EXISTS agencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  database_name VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) DEFAULT NULL,
  address TEXT,
  gst_number VARCHAR(50) DEFAULT NULL,
  pan_number VARCHAR(50) DEFAULT NULL,
  logo_url VARCHAR(255) DEFAULT NULL,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  subscription_plan VARCHAR(50) DEFAULT 'basic',
  subscription_expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_database_name (database_name),
  INDEX idx_email (email)
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

-- Add agecny_id column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS agecny_id INT DEFAULT NULL AFTER roleId;
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_agecny_id (agecny_id);

-- System audit logs
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
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

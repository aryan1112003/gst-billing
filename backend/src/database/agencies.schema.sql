-- Agencies table for master database
-- This table stores agency/company information and their database references

CREATE TABLE IF NOT EXISTS agencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  database_name VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  gst_number VARCHAR(50),
  pan_number VARCHAR(50),
  logo_url VARCHAR(500),
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  subscription_plan VARCHAR(50) DEFAULT 'basic',
  subscription_expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_database_name (database_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update users table to add agency_id foreign key (if not exists)
-- Note: The existing table has a typo 'agecny_id', we'll keep it for compatibility
-- but add proper reference

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS agency_id INT NULL,
  ADD INDEX IF NOT EXISTS idx_agency_id (agency_id);

-- Note: If you want to fix the typo, run this migration separately:
-- ALTER TABLE users CHANGE COLUMN agecny_id agency_id INT;

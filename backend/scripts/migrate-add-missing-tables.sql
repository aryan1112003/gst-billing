-- ============================================================================
-- MIGRATION: Add missing tables and agency_id columns
-- Compatible with MySQL 5.7+ and MySQL 8.x
-- Run this against your agency database (DB_NAME in .env, e.g. mawebtec_lms)
-- Safe to run multiple times — uses IF NOT EXISTS / INFORMATION_SCHEMA guards
-- ============================================================================

-- ============================================================================
-- PART 1: Add agency_id column to existing tables (missing column → 500 errors)
-- Uses INFORMATION_SCHEMA to safely skip if column already exists
-- ============================================================================

-- vendors
DROP PROCEDURE IF EXISTS add_agency_id_vendors;
DELIMITER $$
CREATE PROCEDURE add_agency_id_vendors()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendors' AND COLUMN_NAME = 'agency_id'
  ) THEN
    ALTER TABLE vendors ADD COLUMN agency_id INT NOT NULL DEFAULT 1 AFTER id;
    ALTER TABLE vendors ADD INDEX idx_agency_id (agency_id);
  END IF;
END$$
DELIMITER ;
CALL add_agency_id_vendors();
DROP PROCEDURE IF EXISTS add_agency_id_vendors;

-- items
DROP PROCEDURE IF EXISTS add_agency_id_items;
DELIMITER $$
CREATE PROCEDURE add_agency_id_items()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'items' AND COLUMN_NAME = 'agency_id'
  ) THEN
    ALTER TABLE items ADD COLUMN agency_id INT NOT NULL DEFAULT 1 AFTER id;
    ALTER TABLE items ADD INDEX idx_agency_id (agency_id);
  END IF;
END$$
DELIMITER ;
CALL add_agency_id_items();
DROP PROCEDURE IF EXISTS add_agency_id_items;

-- invoices
DROP PROCEDURE IF EXISTS add_agency_id_invoices;
DELIMITER $$
CREATE PROCEDURE add_agency_id_invoices()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invoices' AND COLUMN_NAME = 'agency_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN agency_id INT NOT NULL DEFAULT 1 AFTER id;
    ALTER TABLE invoices ADD INDEX idx_agency_id (agency_id);
  END IF;
END$$
DELIMITER ;
CALL add_agency_id_invoices();
DROP PROCEDURE IF EXISTS add_agency_id_invoices;

-- expenses
DROP PROCEDURE IF EXISTS add_agency_id_expenses;
DELIMITER $$
CREATE PROCEDURE add_agency_id_expenses()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'expenses' AND COLUMN_NAME = 'agency_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN agency_id INT NOT NULL DEFAULT 1 AFTER id;
    ALTER TABLE expenses ADD INDEX idx_agency_id (agency_id);
  END IF;
END$$
DELIMITER ;
CALL add_agency_id_expenses();
DROP PROCEDURE IF EXISTS add_agency_id_expenses;

-- purchase (purchases table)
DROP PROCEDURE IF EXISTS add_agency_id_purchase;
DELIMITER $$
CREATE PROCEDURE add_agency_id_purchase()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase' AND COLUMN_NAME = 'agency_id'
  ) THEN
    ALTER TABLE purchase ADD COLUMN agency_id INT NOT NULL DEFAULT 1 AFTER id;
    ALTER TABLE purchase ADD INDEX idx_agency_id (agency_id);
  END IF;
END$$
DELIMITER ;
CALL add_agency_id_purchase();
DROP PROCEDURE IF EXISTS add_agency_id_purchase;

-- payments_received
DROP PROCEDURE IF EXISTS add_agency_id_payments;
DELIMITER $$
CREATE PROCEDURE add_agency_id_payments()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments_received' AND COLUMN_NAME = 'agency_id'
  ) THEN
    ALTER TABLE payments_received ADD COLUMN agency_id INT NOT NULL DEFAULT 1 AFTER id;
    ALTER TABLE payments_received ADD INDEX idx_agency_id (agency_id);
  END IF;
END$$
DELIMITER ;
CALL add_agency_id_payments();
DROP PROCEDURE IF EXISTS add_agency_id_payments;

-- ============================================================================
-- PART 2: Create new tables (all use IF NOT EXISTS — safe to re-run)
-- ============================================================================

-- Gate Passes (was missing → caused 500 on /api/v1/gate-passes)
CREATE TABLE IF NOT EXISTS gate_passes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gate_pass_number VARCHAR(50) UNIQUE NOT NULL,
  type ENUM('inward', 'outward') NOT NULL,
  party_name VARCHAR(255) NOT NULL,
  vehicle_number VARCHAR(50) NOT NULL,
  driver_name VARCHAR(255) NOT NULL,
  driver_phone VARCHAR(20) NOT NULL,
  purpose TEXT,
  items_description TEXT NOT NULL,
  quantity DECIMAL(15,2) NOT NULL,
  unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
  remarks TEXT,
  status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
  created_by INT NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INT DEFAULT NULL,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_gate_pass_number (gate_pass_number),
  INDEX idx_type (type),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  vendor_id INT,
  vendor_name VARCHAR(255) NOT NULL,
  order_date DATE NOT NULL,
  expected_delivery DATE,
  status ENUM('draft','sent','received','cancelled') DEFAULT 'draft',
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_by INT NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INT DEFAULT NULL,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_po_number (po_number),
  INDEX idx_status (status),
  INDEX idx_vendor (vendor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Production Orders
CREATE TABLE IF NOT EXISTS production_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  item_id INT,
  quantity DECIMAL(15,2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'pcs',
  planned_date DATE NOT NULL,
  completion_date DATE,
  status ENUM('planned','in-progress','completed','cancelled') DEFAULT 'planned',
  notes TEXT,
  created_by INT NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INT DEFAULT NULL,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_order_number (order_number),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bill of Materials (headers)
CREATE TABLE IF NOT EXISTS bom_headers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bom_number VARCHAR(50) UNIQUE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  item_id INT,
  quantity DECIMAL(15,2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'pcs',
  status ENUM('active','inactive') DEFAULT 'active',
  created_by INT NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INT DEFAULT NULL,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_bom_number (bom_number),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bill of Materials (components)
CREATE TABLE IF NOT EXISTS bom_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bom_id INT NOT NULL,
  component_name VARCHAR(255) NOT NULL,
  item_id INT,
  quantity DECIMAL(15,2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'pcs',
  notes TEXT,
  INDEX idx_bom_id (bom_id),
  FOREIGN KEY (bom_id) REFERENCES bom_headers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recurring Invoices
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recurring_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT,
  customer_name VARCHAR(255) NOT NULL,
  frequency ENUM('weekly','monthly','quarterly','yearly') NOT NULL,
  next_date DATE NOT NULL,
  end_date DATE,
  amount DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  description TEXT,
  status ENUM('active','paused','completed') DEFAULT 'active',
  last_generated DATE,
  created_by INT NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INT DEFAULT NULL,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_recurring_number (recurring_number),
  INDEX idx_status (status),
  INDEX idx_next_date (next_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Time Tracking
CREATE TABLE IF NOT EXISTS time_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entry_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT,
  customer_name VARCHAR(255),
  project_name VARCHAR(255) NOT NULL,
  work_date DATE NOT NULL,
  hours DECIMAL(5,2) NOT NULL,
  description TEXT,
  billable TINYINT(1) DEFAULT 1,
  billed TINYINT(1) DEFAULT 0,
  hourly_rate DECIMAL(15,2) DEFAULT 0,
  created_by INT NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INT DEFAULT NULL,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_entry_number (entry_number),
  INDEX idx_work_date (work_date),
  INDEX idx_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_number VARCHAR(50) UNIQUE NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  customer_id INT,
  customer_name VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE,
  budget DECIMAL(15,2) DEFAULT 0,
  billed_amount DECIMAL(15,2) DEFAULT 0,
  status ENUM('planning','active','on-hold','completed','cancelled') DEFAULT 'planning',
  description TEXT,
  created_by INT NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INT DEFAULT NULL,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_project_number (project_number),
  INDEX idx_status (status),
  INDEX idx_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trip Sheets
CREATE TABLE IF NOT EXISTS trip_sheets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_number VARCHAR(50) UNIQUE NOT NULL,
  vehicle_number VARCHAR(50) NOT NULL,
  driver_name VARCHAR(255) NOT NULL,
  driver_phone VARCHAR(20) NOT NULL,
  from_location VARCHAR(255) NOT NULL,
  to_location VARCHAR(255) NOT NULL,
  departure_date DATETIME NOT NULL,
  return_date DATETIME,
  purpose TEXT,
  distance_km DECIMAL(10,2) DEFAULT 0,
  fuel_cost DECIMAL(15,2) DEFAULT 0,
  status ENUM('planned','in-transit','completed','cancelled') DEFAULT 'planned',
  created_by INT NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INT DEFAULT NULL,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_trip_number (trip_number),
  INDEX idx_status (status),
  INDEX idx_vehicle (vehicle_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fleet / Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_number VARCHAR(50) UNIQUE NOT NULL,
  vehicle_type VARCHAR(100) NOT NULL,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT,
  color VARCHAR(50),
  registration_date DATE,
  insurance_expiry DATE,
  fitness_expiry DATE,
  rc_number VARCHAR(100),
  status ENUM('active','inactive','under-maintenance') DEFAULT 'active',
  created_by INT NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INT DEFAULT NULL,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vehicle_number (vehicle_number),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Batch Tracking
CREATE TABLE IF NOT EXISTS batches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  batch_number VARCHAR(100) UNIQUE NOT NULL,
  item_id INT,
  item_name VARCHAR(255) NOT NULL,
  manufacturing_date DATE,
  expiry_date DATE NOT NULL,
  quantity DECIMAL(15,2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'pcs',
  supplier_name VARCHAR(255),
  purchase_rate DECIMAL(15,2) DEFAULT 0,
  status ENUM('active','expired','recalled','consumed') DEFAULT 'active',
  created_by INT NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INT DEFAULT NULL,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_batch_number (batch_number),
  INDEX idx_expiry (expiry_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customs / Shipping
CREATE TABLE IF NOT EXISTS customs_shipments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipment_number VARCHAR(50) UNIQUE NOT NULL,
  type ENUM('import','export') NOT NULL,
  party_name VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  port VARCHAR(255),
  bill_of_lading VARCHAR(100),
  shipment_date DATE NOT NULL,
  clearance_date DATE,
  duty_amount DECIMAL(15,2) DEFAULT 0,
  freight_amount DECIMAL(15,2) DEFAULT 0,
  total_value DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'INR',
  status ENUM('in-transit','at-port','cleared','delivered') DEFAULT 'in-transit',
  created_by INT NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INT DEFAULT NULL,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shipment_number (shipment_number),
  INDEX idx_type (type),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- POS / Counter Sales
CREATE TABLE IF NOT EXISTS pos_sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT,
  customer_name VARCHAR(255) DEFAULT 'Walk-in Customer',
  sale_date DATETIME NOT NULL,
  items_json LONGTEXT,
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  payment_method ENUM('cash','card','upi','other') DEFAULT 'cash',
  status ENUM('completed','refunded') DEFAULT 'completed',
  created_by INT NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INT DEFAULT NULL,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sale_number (sale_number),
  INDEX idx_sale_date (sale_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Verify: run these SELECTs to confirm everything was applied
-- ============================================================================
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendors' AND COLUMN_NAME = 'agency_id';
-- SHOW TABLES LIKE 'gate_passes';
-- SHOW TABLES LIKE 'purchase_orders';
-- SHOW TABLES LIKE 'vehicles';

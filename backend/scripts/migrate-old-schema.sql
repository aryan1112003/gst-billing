-- Migration script to add missing columns to mawebtec_lms database
USE mawebtec_lms;

-- ============================================
-- CUSTOMERS TABLE - Add missing columns
-- ============================================

-- Add address_street if not exists
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mawebtec_lms' AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'address_street';
SET @query = IF(@col_exists = 0, 'ALTER TABLE customers ADD COLUMN address_street VARCHAR(255) AFTER phone', 'SELECT "address_street already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add address_city if not exists
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mawebtec_lms' AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'address_city';
SET @query = IF(@col_exists = 0, 'ALTER TABLE customers ADD COLUMN address_city VARCHAR(100) AFTER address_street', 'SELECT "address_city already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add address_state if not exists
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mawebtec_lms' AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'address_state';
SET @query = IF(@col_exists = 0, 'ALTER TABLE customers ADD COLUMN address_state VARCHAR(100) AFTER address_city', 'SELECT "address_state already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add address_zip_code if not exists
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mawebtec_lms' AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'address_zip_code';
SET @query = IF(@col_exists = 0, 'ALTER TABLE customers ADD COLUMN address_zip_code VARCHAR(20) AFTER address_state', 'SELECT "address_zip_code already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add address_country if not exists
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mawebtec_lms' AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'address_country';
SET @query = IF(@col_exists = 0, 'ALTER TABLE customers ADD COLUMN address_country VARCHAR(100) AFTER address_zip_code', 'SELECT "address_country already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add credit_limit if not exists
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mawebtec_lms' AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'credit_limit';
SET @query = IF(@col_exists = 0, 'ALTER TABLE customers ADD COLUMN credit_limit DECIMAL(15,2) DEFAULT 0 AFTER gstin', 'SELECT "credit_limit already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add payment_terms if not exists
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mawebtec_lms' AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'payment_terms';
SET @query = IF(@col_exists = 0, 'ALTER TABLE customers ADD COLUMN payment_terms VARCHAR(100) AFTER credit_limit', 'SELECT "payment_terms already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add is_active if not exists
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mawebtec_lms' AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'is_active';
SET @query = IF(@col_exists = 0, 'ALTER TABLE customers ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER payment_terms', 'SELECT "is_active already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- ITEMS TABLE - Add missing columns
-- ============================================

-- Add hsn_code if not exists
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mawebtec_lms' AND TABLE_NAME = 'items' AND COLUMN_NAME = 'hsn_code';
SET @query = IF(@col_exists = 0, 'ALTER TABLE items ADD COLUMN hsn_code VARCHAR(20) AFTER description', 'SELECT "hsn_code already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add unit_price if not exists
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mawebtec_lms' AND TABLE_NAME = 'items' AND COLUMN_NAME = 'unit_price';
SET @query = IF(@col_exists = 0, 'ALTER TABLE items ADD COLUMN unit_price DECIMAL(15,2) DEFAULT 0 AFTER hsn_code', 'SELECT "unit_price already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add reorder_level if not exists
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mawebtec_lms' AND TABLE_NAME = 'items' AND COLUMN_NAME = 'reorder_level';
SET @query = IF(@col_exists = 0, 'ALTER TABLE items ADD COLUMN reorder_level INT DEFAULT 10 AFTER current_stock', 'SELECT "reorder_level already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add is_active if not exists
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mawebtec_lms' AND TABLE_NAME = 'items' AND COLUMN_NAME = 'is_active';
SET @query = IF(@col_exists = 0, 'ALTER TABLE items ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER reorder_level', 'SELECT "is_active already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Copy selling_price to unit_price if unit_price is 0 or NULL
UPDATE items SET unit_price = selling_price WHERE unit_price IS NULL OR unit_price = 0;

SELECT 'Migration completed successfully!' AS status;

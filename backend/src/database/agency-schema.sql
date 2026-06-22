-- ============================================================================
-- AGENCY DATABASE SCHEMA
-- This schema is replicated for each new agency/user
-- Each agency gets their own isolated database with these tables
-- ============================================================================

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customertype_id INT DEFAULT 1,
  salutation_id INT DEFAULT 1,
  fname VARCHAR(255) NOT NULL,
  lname VARCHAR(255) DEFAULT '',
  company_name VARCHAR(255) NOT NULL,
  cdisplay_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) DEFAULT '',
  cwork_phone VARCHAR(255) DEFAULT NULL,
  cmobile_phone VARCHAR(255) DEFAULT NULL,
  skype_name VARCHAR(255) DEFAULT NULL,
  designation VARCHAR(255) DEFAULT NULL,
  department VARCHAR(255) DEFAULT NULL,
  website VARCHAR(255) DEFAULT '',
  gst_treatment INT DEFAULT 1,
  gstin_number VARCHAR(60) DEFAULT NULL,
  place_of_supply INT DEFAULT NULL,
  taxpreferences INT DEFAULT NULL,
  reason_exempt VARCHAR(255) DEFAULT NULL,
  currency_id INT DEFAULT 21,
  payment_terms INT DEFAULT NULL,
  enable_portal INT DEFAULT 0,
  custom_fields VARCHAR(255) DEFAULT '',
  remark LONGTEXT,
  is_active INT DEFAULT 1,
  created_by INT NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INT DEFAULT NULL,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company_name (company_name),
  INDEX idx_customer_email (customer_email),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_name VARCHAR(255) NOT NULL,
  vendor_email VARCHAR(255) DEFAULT '',
  vendor_phone VARCHAR(255) DEFAULT NULL,
  vendor_mobile VARCHAR(255) DEFAULT NULL,
  company_name VARCHAR(255) DEFAULT '',
  address LONGTEXT,
  city VARCHAR(255) DEFAULT NULL,
  state VARCHAR(255) DEFAULT NULL,
  zip_code VARCHAR(255) DEFAULT NULL,
  gstin_number VARCHAR(255) DEFAULT NULL,
  pan_number VARCHAR(100) DEFAULT NULL,
  website VARCHAR(255) DEFAULT '',
  bank_name VARCHAR(150) DEFAULT NULL,
  bank_branch VARCHAR(255) DEFAULT NULL,
  account_number VARCHAR(255) DEFAULT NULL,
  account_type VARCHAR(255) DEFAULT NULL,
  ifsc_code VARCHAR(255) DEFAULT NULL,
  remark LONGTEXT,
  is_active INT DEFAULT 1,
  created_by INT NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INT DEFAULT NULL,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vendor_name (vendor_name),
  INDEX idx_vendor_email (vendor_email),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Items/Products table
CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_code VARCHAR(50) UNIQUE NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  item_type VARCHAR(50) DEFAULT 'goods',
  unit VARCHAR(50) DEFAULT 'pcs',
  hsn_code VARCHAR(50) DEFAULT NULL,
  sac_code VARCHAR(50) DEFAULT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0.00,
  selling_price DECIMAL(15,2) DEFAULT 0.00,
  purchase_price DECIMAL(15,2) DEFAULT 0.00,
  opening_stock DECIMAL(15,2) DEFAULT 0.00,
  opening_stock_rate DECIMAL(15,2) DEFAULT 0.00,
  reorder_point DECIMAL(15,2) DEFAULT 0.00,
  description TEXT,
  is_active INT DEFAULT 1,
  created_by INT NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INT DEFAULT NULL,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_item_code (item_code),
  INDEX idx_item_name (item_name),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoices table (Sales)
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE DEFAULT NULL,
  payment_terms VARCHAR(100) DEFAULT NULL,
  subject VARCHAR(255) DEFAULT NULL,
  subtotal DECIMAL(15,2) DEFAULT 0.00,
  discount_amount DECIMAL(15,2) DEFAULT 0.00,
  tax_amount DECIMAL(15,2) DEFAULT 0.00,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0.00,
  balance_amount DECIMAL(15,2) DEFAULT 0.00,
  type VARCHAR(50) DEFAULT 'invoice',
  status VARCHAR(50) DEFAULT 'draft',
  customer_notes TEXT,
  terms_conditions TEXT,
  is_deleted TINYINT DEFAULT 0,
  created_by INT NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INT DEFAULT NULL,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_invoice_number (invoice_number),
  INDEX idx_customer_id (customer_id),
  INDEX idx_invoice_date (invoice_date),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_is_deleted (is_deleted),
  INDEX idx_customer_status (customer_id, status),
  INDEX idx_invoice_date_status (invoice_date, status),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoice Items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  item_id INT DEFAULT NULL,
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(15,2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'pcs',
  rate DECIMAL(15,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0.00,
  tax_rate DECIMAL(5,2) DEFAULT 0.00,
  amount DECIMAL(15,2) NOT NULL,
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_item_id (item_id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Purchases table
CREATE TABLE IF NOT EXISTS purchase (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_number VARCHAR(50) UNIQUE NOT NULL,
  vendor_id INT NOT NULL,
  purchase_date DATE NOT NULL,
  due_date DATE DEFAULT NULL,
  payment_terms VARCHAR(100) DEFAULT NULL,
  reference_number VARCHAR(100) DEFAULT NULL,
  subtotal DECIMAL(15,2) DEFAULT 0.00,
  discount_amount DECIMAL(15,2) DEFAULT 0.00,
  tax_amount DECIMAL(15,2) DEFAULT 0.00,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0.00,
  balance_amount DECIMAL(15,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'draft',
  vendor_notes TEXT,
  terms_conditions TEXT,
  is_deleted TINYINT DEFAULT 0,
  created_by INT NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INT DEFAULT NULL,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_purchase_number (purchase_number),
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_purchase_date (purchase_date),
  INDEX idx_status (status),
  INDEX idx_is_deleted (is_deleted),
  INDEX idx_vendor_status (vendor_id, status),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Purchase Items table
CREATE TABLE IF NOT EXISTS purchase_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_id INT NOT NULL,
  item_id INT DEFAULT NULL,
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity DECIMAL(15,2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'pcs',
  rate DECIMAL(15,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0.00,
  tax_rate DECIMAL(5,2) DEFAULT 0.00,
  amount DECIMAL(15,2) NOT NULL,
  INDEX idx_purchase_id (purchase_id),
  INDEX idx_item_id (item_id),
  FOREIGN KEY (purchase_id) REFERENCES purchase(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments Received table
CREATE TABLE IF NOT EXISTS payments_received (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT NOT NULL,
  payment_date DATE NOT NULL,
  payment_mode VARCHAR(50) DEFAULT 'cash',
  amount DECIMAL(15,2) NOT NULL,
  bank_charges DECIMAL(15,2) DEFAULT 0.00,
  reference_number VARCHAR(100) DEFAULT NULL,
  notes TEXT,
  created_by INT NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INT DEFAULT NULL,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payment_number (payment_number),
  INDEX idx_customer_id (customer_id),
  INDEX idx_payment_date (payment_date),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment Allocations table (links payments to invoices)
CREATE TABLE IF NOT EXISTS payment_allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  invoice_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  INDEX idx_payment_id (payment_id),
  INDEX idx_invoice_id (invoice_id),
  FOREIGN KEY (payment_id) REFERENCES payments_received(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expense_number VARCHAR(50) UNIQUE NOT NULL,
  expense_date DATE NOT NULL,
  category VARCHAR(100) DEFAULT NULL,
  vendor_id INT DEFAULT NULL,
  amount DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0.00,
  total_amount DECIMAL(15,2) NOT NULL,
  payment_mode VARCHAR(50) DEFAULT 'cash',
  reference_number VARCHAR(100) DEFAULT NULL,
  description TEXT,
  is_billable INT DEFAULT 0,
  invoice_id INT DEFAULT NULL,
  created_by INT NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INT DEFAULT NULL,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_expense_number (expense_number),
  INDEX idx_expense_date (expense_date),
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_expense_date_category (expense_date, category),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock Movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  movement_type VARCHAR(50) NOT NULL,
  quantity DECIMAL(15,2) NOT NULL,
  reference_type VARCHAR(50) DEFAULT NULL,
  reference_id INT DEFAULT NULL,
  movement_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_by INT NOT NULL,
  INDEX idx_item_id (item_id),
  INDEX idx_movement_type (movement_type),
  INDEX idx_movement_date (movement_date),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100) DEFAULT NULL,
  record_id INT DEFAULT NULL,
  old_values TEXT,
  new_values TEXT,
  ip_address VARCHAR(50) DEFAULT NULL,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_table_name (table_name),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email Logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) DEFAULT NULL,
  body TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  sent_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_recipient_email (recipient_email),
  INDEX idx_status (status),
  INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings table (agency-specific settings)
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'string',
  description TEXT,
  updated_by INT DEFAULT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES
('company_name', '', 'string', 'Company name for invoices and documents'),
('company_address', '', 'text', 'Company address'),
('company_phone', '', 'string', 'Company phone number'),
('company_email', '', 'string', 'Company email'),
('company_gstin', '', 'string', 'Company GSTIN number'),
('company_pan', '', 'string', 'Company PAN number'),
('invoice_prefix', 'INV', 'string', 'Invoice number prefix'),
('invoice_next_number', '1', 'number', 'Next invoice number'),
('purchase_prefix', 'PO', 'string', 'Purchase order prefix'),
('purchase_next_number', '1', 'number', 'Next purchase order number'),
('payment_prefix', 'PAY', 'string', 'Payment number prefix'),
('payment_next_number', '1', 'number', 'Next payment number'),
('expense_prefix', 'EXP', 'string', 'Expense number prefix'),
('expense_next_number', '1', 'number', 'Next expense number'),
('default_tax_rate', '18', 'number', 'Default tax rate percentage'),
('currency_symbol', '₹', 'string', 'Currency symbol'),
('date_format', 'DD/MM/YYYY', 'string', 'Date format for display'),
('fiscal_year_start', '04-01', 'string', 'Fiscal year start (MM-DD)');

-- Gate Passes table
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
  unit VARCHAR(50) NOT NULL,
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
  INDEX idx_bom_id (bom_id)
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

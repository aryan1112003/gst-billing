CREATE TABLE IF NOT EXISTS purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_number VARCHAR(50) NOT NULL,
  vendor_id INT NOT NULL,
  purchase_date DATE NOT NULL,
  due_date DATE,
  sub_total DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  status TINYINT DEFAULT 1, -- 1: Pending, 2: Received, etc.
  notes TEXT,
  items_details JSON,
  agency_id INT DEFAULT 0,
  is_deleted TINYINT DEFAULT 0,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INT,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

-- Seed data for ERP Business Management System

-- Insert default admin user
INSERT INTO users (email, password_hash, name, role, permissions) VALUES 
('admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin', ARRAY['all']),
('accountant@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Chief Accountant', 'accountant', ARRAY['customers', 'invoices', 'payments', 'expenses', 'reports']),
('sales@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sales Manager', 'sales', ARRAY['customers', 'invoices', 'items', 'reports']);

-- Insert sample customers
INSERT INTO customers (name, email, phone, address_street, address_city, address_state, address_zip_code, gstin, credit_limit, payment_terms) VALUES 
('Acme Corporation', 'contact@acme.com', '+91-9876543210', '123 Business Street', 'Mumbai', 'Maharashtra', '400001', '27AABCU9603R1ZX', 100000.00, 30),
('Tech Solutions Pvt Ltd', 'info@techsolutions.com', '+91-9876543211', '456 Tech Park', 'Bangalore', 'Karnataka', '560001', '29AABCU9603R1ZY', 150000.00, 45),
('Global Enterprises', 'sales@global.com', '+91-9876543212', '789 Corporate Avenue', 'Delhi', 'Delhi', '110001', '07AABCU9603R1ZZ', 200000.00, 30),
('Innovative Systems', 'contact@innovative.com', '+91-9876543213', '321 Innovation Hub', 'Pune', 'Maharashtra', '411001', '27AABCU9603R1ZA', 75000.00, 30),
('Digital Dynamics', 'hello@digital.com', '+91-9876543214', '654 Digital Street', 'Chennai', 'Tamil Nadu', '600001', '33AABCU9603R1ZB', 120000.00, 60);

-- Insert sample vendors
INSERT INTO vendors (name, email, phone, address_street, address_city, address_state, address_zip_code, gstin, bank_account_number, bank_name, bank_ifsc_code, bank_account_holder_name, payment_terms) VALUES 
('Office Supplies Co', 'orders@officesupplies.com', '+91-9876543220', '111 Supply Street', 'Mumbai', 'Maharashtra', '400002', '27AABCU9603R1ZC', '1234567890', 'HDFC Bank', 'HDFC0001234', 'Office Supplies Co', 30),
('Tech Hardware Ltd', 'procurement@techhardware.com', '+91-9876543221', '222 Hardware Lane', 'Bangalore', 'Karnataka', '560002', '29AABCU9603R1ZD', '2345678901', 'ICICI Bank', 'ICIC0002345', 'Tech Hardware Ltd', 45),
('Software Solutions Inc', 'billing@software.com', '+91-9876543222', '333 Software Plaza', 'Hyderabad', 'Telangana', '500001', '36AABCU9603R1ZE', '3456789012', 'SBI Bank', 'SBIN0003456', 'Software Solutions Inc', 30);

-- Insert sample items
INSERT INTO items (sku, name, description, hsn_code, unit_price, current_stock, reorder_level, unit) VALUES 
('LAPTOP001', 'Dell Latitude 5520', 'Business laptop with Intel i5 processor', '84713020', 65000.00, 25, 5, 'pcs'),
('MOUSE001', 'Logitech MX Master 3', 'Wireless productivity mouse', '84716070', 7500.00, 50, 10, 'pcs'),
('KEYBOARD001', 'Logitech MX Keys', 'Wireless illuminated keyboard', '84716070', 9500.00, 30, 8, 'pcs'),
('MONITOR001', 'Dell 24" FHD Monitor', '24-inch Full HD LED monitor', '85285210', 15000.00, 15, 3, 'pcs'),
('PRINTER001', 'HP LaserJet Pro M404n', 'Monochrome laser printer', '84433210', 18000.00, 8, 2, 'pcs'),
('CABLE001', 'USB-C to USB-A Cable', '1-meter USB-C to USB-A cable', '85444290', 500.00, 100, 20, 'pcs'),
('ADAPTER001', 'USB-C Power Adapter', '65W USB-C power adapter', '85044030', 3500.00, 40, 10, 'pcs'),
('HEADSET001', 'Jabra Evolve 40', 'Professional stereo headset', '85183000', 8500.00, 20, 5, 'pcs'),
('WEBCAM001', 'Logitech C920 HD Pro', 'Full HD 1080p webcam', '85258020', 6500.00, 35, 8, 'pcs'),
('TABLET001', 'iPad Air 64GB', 'Apple iPad Air with 64GB storage', '84713010', 54000.00, 12, 3, 'pcs');

-- Insert sample invoices
INSERT INTO invoices (invoice_number, customer_id, issue_date, due_date, subtotal, tax_amount, discount_amount, total_amount, paid_amount, status, notes) VALUES 
('INV-2024-001', (SELECT id FROM customers WHERE email = 'contact@acme.com'), '2024-01-15', '2024-02-14', 130000.00, 23400.00, 0.00, 153400.00, 153400.00, 'paid', 'Bulk order for office setup'),
('INV-2024-002', (SELECT id FROM customers WHERE email = 'info@techsolutions.com'), '2024-01-20', '2024-03-05', 85000.00, 15300.00, 2000.00, 98300.00, 50000.00, 'sent', 'Development team equipment'),
('INV-2024-003', (SELECT id FROM customers WHERE email = 'sales@global.com'), '2024-02-01', '2024-03-02', 45000.00, 8100.00, 0.00, 53100.00, 0.00, 'sent', 'Conference room setup'),
('INV-2024-004', (SELECT id FROM customers WHERE email = 'contact@innovative.com'), '2024-02-10', '2024-03-11', 72000.00, 12960.00, 1500.00, 83460.00, 83460.00, 'paid', 'Quarterly hardware refresh'),
('INV-2024-005', (SELECT id FROM customers WHERE email = 'hello@digital.com'), '2024-02-15', '2024-04-15', 95000.00, 17100.00, 0.00, 112100.00, 25000.00, 'overdue', 'New office branch setup');

-- Insert sample invoice line items
INSERT INTO invoice_line_items (invoice_id, item_id, quantity, unit_price, total) VALUES 
-- Invoice 1 line items
((SELECT id FROM invoices WHERE invoice_number = 'INV-2024-001'), (SELECT id FROM items WHERE sku = 'LAPTOP001'), 2, 65000.00, 130000.00),
-- Invoice 2 line items  
((SELECT id FROM invoices WHERE invoice_number = 'INV-2024-002'), (SELECT id FROM items WHERE sku = 'LAPTOP001'), 1, 65000.00, 65000.00),
((SELECT id FROM invoices WHERE invoice_number = 'INV-2024-002'), (SELECT id FROM items WHERE sku = 'MONITOR001'), 1, 15000.00, 15000.00),
((SELECT id FROM invoices WHERE invoice_number = 'INV-2024-002'), (SELECT id FROM items WHERE sku = 'MOUSE001'), 1, 7500.00, 7500.00),
-- Invoice 3 line items
((SELECT id FROM invoices WHERE invoice_number = 'INV-2024-003'), (SELECT id FROM items WHERE sku = 'MONITOR001'), 3, 15000.00, 45000.00),
-- Invoice 4 line items
((SELECT id FROM invoices WHERE invoice_number = 'INV-2024-004'), (SELECT id FROM items WHERE sku = 'LAPTOP001'), 1, 65000.00, 65000.00),
((SELECT id FROM invoices WHERE invoice_number = 'INV-2024-004'), (SELECT id FROM items WHERE sku = 'MOUSE001'), 1, 7500.00, 7500.00),
-- Invoice 5 line items
((SELECT id FROM invoices WHERE invoice_number = 'INV-2024-005'), (SELECT id FROM items WHERE sku = 'LAPTOP001'), 1, 65000.00, 65000.00),
((SELECT id FROM invoices WHERE invoice_number = 'INV-2024-005'), (SELECT id FROM items WHERE sku = 'MONITOR001'), 2, 15000.00, 30000.00);

-- Insert sample payments
INSERT INTO payments (customer_id, amount, payment_date, payment_mode, reference_number, notes) VALUES 
((SELECT id FROM customers WHERE email = 'contact@acme.com'), 153400.00, '2024-02-10', 'neft', 'NEFT240210001', 'Payment for INV-2024-001'),
((SELECT id FROM customers WHERE email = 'info@techsolutions.com'), 50000.00, '2024-02-15', 'cheque', 'CHQ123456', 'Partial payment for INV-2024-002'),
((SELECT id FROM customers WHERE email = 'contact@innovative.com'), 83460.00, '2024-03-05', 'upi', 'UPI240305001', 'Payment for INV-2024-004'),
((SELECT id FROM customers WHERE email = 'hello@digital.com'), 25000.00, '2024-03-01', 'neft', 'NEFT240301001', 'Partial payment for INV-2024-005');

-- Insert payment allocations
INSERT INTO payment_allocations (payment_id, invoice_id, amount) VALUES 
((SELECT id FROM payments WHERE reference_number = 'NEFT240210001'), (SELECT id FROM invoices WHERE invoice_number = 'INV-2024-001'), 153400.00),
((SELECT id FROM payments WHERE reference_number = 'CHQ123456'), (SELECT id FROM invoices WHERE invoice_number = 'INV-2024-002'), 50000.00),
((SELECT id FROM payments WHERE reference_number = 'UPI240305001'), (SELECT id FROM invoices WHERE invoice_number = 'INV-2024-004'), 83460.00),
((SELECT id FROM payments WHERE reference_number = 'NEFT240301001'), (SELECT id FROM invoices WHERE invoice_number = 'INV-2024-005'), 25000.00);

-- Insert sample purchases
INSERT INTO purchases (purchase_number, vendor_id, purchase_date, subtotal, tax_amount, total_amount, status, notes) VALUES 
('PUR-2024-001', (SELECT id FROM vendors WHERE email = 'orders@officesupplies.com'), '2024-01-10', 25000.00, 4500.00, 29500.00, 'delivered', 'Office supplies restocking'),
('PUR-2024-002', (SELECT id FROM vendors WHERE email = 'procurement@techhardware.com'), '2024-01-15', 195000.00, 35100.00, 230100.00, 'delivered', 'Hardware inventory replenishment'),
('PUR-2024-003', (SELECT id FROM vendors WHERE email = 'billing@software.com'), '2024-02-01', 50000.00, 9000.00, 59000.00, 'pending', 'Software licenses renewal');

-- Insert sample purchase line items
INSERT INTO purchase_line_items (purchase_id, item_id, quantity, unit_cost, total) VALUES 
-- Purchase 1 line items
((SELECT id FROM purchases WHERE purchase_number = 'PUR-2024-001'), (SELECT id FROM items WHERE sku = 'MOUSE001'), 10, 6500.00, 65000.00),
((SELECT id FROM purchases WHERE purchase_number = 'PUR-2024-001'), (SELECT id FROM items WHERE sku = 'CABLE001'), 50, 400.00, 20000.00),
-- Purchase 2 line items
((SELECT id FROM purchases WHERE purchase_number = 'PUR-2024-002'), (SELECT id FROM items WHERE sku = 'LAPTOP001'), 3, 60000.00, 180000.00),
((SELECT id FROM purchases WHERE purchase_number = 'PUR-2024-002'), (SELECT id FROM items WHERE sku = 'MONITOR001'), 1, 13000.00, 13000.00);

-- Insert sample expenses
INSERT INTO expenses (amount, category, description, expense_date, is_billable, customer_id) VALUES 
(5000.00, 'Office Rent', 'Monthly office rent payment', '2024-01-01', false, NULL),
(2500.00, 'Utilities', 'Electricity and internet bills', '2024-01-05', false, NULL),
(8000.00, 'Travel', 'Client meeting travel expenses', '2024-01-10', true, (SELECT id FROM customers WHERE email = 'contact@acme.com')),
(3500.00, 'Marketing', 'Online advertising campaign', '2024-01-15', false, NULL),
(1200.00, 'Office Supplies', 'Stationery and printing materials', '2024-01-20', false, NULL),
(15000.00, 'Professional Services', 'Legal consultation fees', '2024-01-25', false, NULL),
(4500.00, 'Software', 'Monthly SaaS subscriptions', '2024-02-01', false, NULL),
(6000.00, 'Training', 'Employee training and certification', '2024-02-05', false, NULL),
(2800.00, 'Maintenance', 'Office equipment maintenance', '2024-02-10', false, NULL),
(7500.00, 'Consulting', 'Technical consulting services', '2024-02-15', true, (SELECT id FROM customers WHERE email = 'info@techsolutions.com'));

-- Insert sample stock movements
INSERT INTO stock_movements (item_id, movement_type, quantity, reference_type, reference_id, notes) VALUES 
-- Initial stock entries
((SELECT id FROM items WHERE sku = 'LAPTOP001'), 'in', 30, 'initial', NULL, 'Initial stock entry'),
((SELECT id FROM items WHERE sku = 'MOUSE001'), 'in', 60, 'initial', NULL, 'Initial stock entry'),
((SELECT id FROM items WHERE sku = 'KEYBOARD001'), 'in', 35, 'initial', NULL, 'Initial stock entry'),
((SELECT id FROM items WHERE sku = 'MONITOR001'), 'in', 20, 'initial', NULL, 'Initial stock entry'),
-- Purchase entries
((SELECT id FROM items WHERE sku = 'LAPTOP001'), 'in', 3, 'purchase', (SELECT id FROM purchases WHERE purchase_number = 'PUR-2024-002'), 'Stock in from purchase'),
((SELECT id FROM items WHERE sku = 'MOUSE001'), 'in', 10, 'purchase', (SELECT id FROM purchases WHERE purchase_number = 'PUR-2024-001'), 'Stock in from purchase'),
-- Sales entries
((SELECT id FROM items WHERE sku = 'LAPTOP001'), 'out', 5, 'invoice', (SELECT id FROM invoices WHERE invoice_number = 'INV-2024-001'), 'Stock out for sales'),
((SELECT id FROM items WHERE sku = 'MONITOR001'), 'out', 6, 'invoice', (SELECT id FROM invoices WHERE invoice_number = 'INV-2024-003'), 'Stock out for sales');

-- Update invoice status based on payments
UPDATE invoices SET status = 'paid' WHERE id IN (
  SELECT i.id FROM invoices i
  JOIN payment_allocations pa ON i.id = pa.invoice_id
  GROUP BY i.id, i.total_amount
  HAVING SUM(pa.amount) >= i.total_amount
);

UPDATE invoices SET status = 'overdue' WHERE due_date < CURRENT_DATE AND status NOT IN ('paid', 'cancelled');

COMMIT;
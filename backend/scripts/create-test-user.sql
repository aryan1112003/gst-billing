-- Create a new test user with sample data

-- Create test user
INSERT INTO users (email, password_hash, name, role, permissions) VALUES 
('test@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test User', 'admin', ARRAY['all']);

-- Get the user ID
SET @test_user_id = LAST_INSERT_ID();

-- Insert test customers for this user
INSERT INTO customers (name, email, phone, address_street, address_city, address_state, address_zip_code, gstin, credit_limit, payment_terms, created_by) VALUES 
('Test Customer 1', 'customer1@test.com', '+91-9999999991', '123 Test Street', 'Mumbai', 'Maharashtra', '400001', '27TESTCU9603R1Z1', 50000.00, 30, @test_user_id),
('Test Customer 2', 'customer2@test.com', '+91-9999999992', '456 Test Avenue', 'Delhi', 'Delhi', '110001', '07TESTCU9603R1Z2', 75000.00, 45, @test_user_id),
('Test Customer 3', 'customer3@test.com', '+91-9999999993', '789 Test Road', 'Bangalore', 'Karnataka', '560001', '29TESTCU9603R1Z3', 100000.00, 30, @test_user_id);

-- Insert test vendors for this user
INSERT INTO vendors (name, email, phone, address_street, address_city, address_state, address_zip_code, gstin, bank_account_number, bank_name, bank_ifsc_code, bank_account_holder_name, payment_terms, created_by) VALUES 
('Test Vendor 1', 'vendor1@test.com', '+91-8888888881', '111 Vendor Street', 'Mumbai', 'Maharashtra', '400002', '27TESTVE9603R1Z1', '1111111111', 'Test Bank', 'TEST0001111', 'Test Vendor 1', 30, @test_user_id),
('Test Vendor 2', 'vendor2@test.com', '+91-8888888882', '222 Vendor Avenue', 'Pune', 'Maharashtra', '411001', '27TESTVE9603R1Z2', '2222222222', 'Test Bank', 'TEST0002222', 'Test Vendor 2', 45, @test_user_id);

-- Insert test items for this user
INSERT INTO items (sku, name, description, hsn_code, unit_price, current_stock, reorder_level, unit, created_by) VALUES 
('TEST001', 'Test Product 1', 'Test product description 1', '12345678', 1000.00, 100, 10, 'pcs', @test_user_id),
('TEST002', 'Test Product 2', 'Test product description 2', '23456789', 2000.00, 50, 5, 'pcs', @test_user_id),
('TEST003', 'Test Service 1', 'Test service description', '99999999', 5000.00, 0, 0, 'hrs', @test_user_id);

-- Insert test invoices
INSERT INTO invoices (invoice_number, customer_id, issue_date, due_date, subtotal, tax_amount, discount_amount, total_amount, paid_amount, status, notes, created_by) VALUES 
('TEST-INV-001', (SELECT id FROM customers WHERE email = 'customer1@test.com'), CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), 10000.00, 1800.00, 0.00, 11800.00, 0.00, 'sent', 'Test invoice 1', @test_user_id),
('TEST-INV-002', (SELECT id FROM customers WHERE email = 'customer2@test.com'), CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 45 DAY), 20000.00, 3600.00, 500.00, 23100.00, 23100.00, 'paid', 'Test invoice 2', @test_user_id);

-- Insert test payments
INSERT INTO payments (customer_id, amount, payment_date, payment_mode, reference_number, notes, created_by) VALUES 
((SELECT id FROM customers WHERE email = 'customer2@test.com'), 23100.00, CURRENT_DATE, 'neft', 'TEST-PAY-001', 'Test payment 1', @test_user_id);

-- Insert test expenses
INSERT INTO expenses (amount, category, description, expense_date, is_billable, created_by) VALUES 
(5000.00, 'Office Rent', 'Test office rent', CURRENT_DATE, false, @test_user_id),
(2000.00, 'Utilities', 'Test utilities', CURRENT_DATE, false, @test_user_id),
(3000.00, 'Travel', 'Test travel expense', CURRENT_DATE, true, @test_user_id);

COMMIT;

-- Display success message
SELECT 'Test user created successfully!' as message,
       'Email: test@example.com' as email,
       'Password: password' as password,
       'Sample data created: 3 customers, 2 vendors, 3 items, 2 invoices, 1 payment, 3 expenses' as data;

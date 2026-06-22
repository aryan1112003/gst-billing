-- Complete Seed Data for MySQL Database
-- This will add fake data for all modules

USE mawebtec_lms;

-- ============================================
-- 1. CUSTOMERS (Already exist, adding more)
-- ============================================
INSERT INTO customers (name, email, phone, address, gstin) VALUES 
('Tech Innovators Pvt Ltd', 'contact@techinnovators.com', '+91-9876543215', '123 Tech Park, Bangalore, Karnataka', '29AABCU9603R1ZF'),
('Global Solutions Inc', 'info@globalsolutions.com', '+91-9876543216', '456 Business Hub, Mumbai, Maharashtra', '27AABCU9603R1ZG'),
('Digital Dynamics Ltd', 'sales@digitaldynamics.com', '+91-9876543217', '789 IT Plaza, Hyderabad, Telangana', '36AABCU9603R1ZH'),
('Smart Systems Co', 'hello@smartsystems.com', '+91-9876543218', '321 Innovation Center, Pune, Maharashtra', '27AABCU9603R1ZI'),
('Future Tech Enterprises', 'contact@futuretech.com', '+91-9876543219', '654 Tech Valley, Chennai, Tamil Nadu', '33AABCU9603R1ZJ'),
('Apex Solutions', 'info@apexsolutions.com', '+91-9876543220', '987 Corporate Tower, Delhi', '07AABCU9603R1ZK'),
('Prime Technologies', 'sales@primetech.com', '+91-9876543221', '147 Business Park, Noida, UP', '09AABCU9603R1ZL'),
('Elite Systems', 'contact@elitesystems.com', '+91-9876543222', '258 Tech Hub, Gurgaon, Haryana', '06AABCU9603R1ZM'),
('Mega Corp Ltd', 'info@megacorp.com', '+91-9876543223', '369 Industrial Area, Ahmedabad, Gujarat', '24AABCU9603R1ZN'),
('Vertex Solutions', 'hello@vertexsolutions.com', '+91-9876543224', '741 IT Park, Kolkata, West Bengal', '19AABCU9603R1ZO');

-- ============================================
-- 2. VENDORS
-- ============================================
INSERT INTO vendors (name, email, phone, address, gstin) VALUES 
('Office Supplies Co', 'orders@officesupplies.com', '+91-9876543230', '111 Supply Street, Mumbai, Maharashtra', '27AABCU9603R1ZP'),
('Tech Hardware Ltd', 'procurement@techhardware.com', '+91-9876543231', '222 Hardware Lane, Bangalore, Karnataka', '29AABCU9603R1ZQ'),
('Software Solutions Inc', 'billing@software.com', '+91-9876543232', '333 Software Plaza, Hyderabad, Telangana', '36AABCU9603R1ZR'),
('Furniture World', 'sales@furnitureworld.com', '+91-9876543233', '444 Furniture Market, Delhi', '07AABCU9603R1ZS'),
('Stationery Hub', 'orders@stationeryhub.com', '+91-9876543234', '555 Market Street, Pune, Maharashtra', '27AABCU9603R1ZT'),
('Electronics Mart', 'info@electronicsmart.com', '+91-9876543235', '666 Electronics Plaza, Chennai, Tamil Nadu', '33AABCU9603R1ZU'),
('Printing Services', 'contact@printingservices.com', '+91-9876543236', '777 Print Street, Kolkata, West Bengal', '19AABCU9603R1ZV'),
('Cleaning Supplies', 'orders@cleaningsupplies.com', '+91-9876543237', '888 Clean Avenue, Ahmedabad, Gujarat', '24AABCU9603R1ZW'),
('IT Equipment Co', 'sales@itequipment.com', '+91-9876543238', '999 IT Market, Noida, UP', '09AABCU9603R1ZX'),
('Packaging Solutions', 'info@packagingsolutions.com', '+91-9876543239', '101 Package Lane, Gurgaon, Haryana', '06AABCU9603R1ZY');

-- ============================================
-- 3. ITEMS/INVENTORY
-- ============================================
INSERT INTO items (sku, name, description, unit, purchase_price, selling_price, current_stock, min_stock_level) VALUES 
-- Electronics
('LAPTOP001', 'Dell Latitude 5520', 'Business laptop with Intel i5 processor, 8GB RAM, 256GB SSD', 'PCS', 60000.00, 65000.00, 25, 5),
('LAPTOP002', 'HP ProBook 450', 'Professional laptop with Intel i7, 16GB RAM, 512GB SSD', 'PCS', 75000.00, 82000.00, 15, 3),
('LAPTOP003', 'Lenovo ThinkPad E14', 'Business laptop with AMD Ryzen 5, 8GB RAM, 512GB SSD', 'PCS', 55000.00, 60000.00, 20, 5),
('MOUSE001', 'Logitech MX Master 3', 'Wireless productivity mouse with ergonomic design', 'PCS', 6500.00, 7500.00, 50, 10),
('MOUSE002', 'Microsoft Surface Mouse', 'Bluetooth wireless mouse', 'PCS', 3500.00, 4200.00, 40, 8),
('KEYBOARD001', 'Logitech MX Keys', 'Wireless illuminated keyboard', 'PCS', 8500.00, 9500.00, 30, 8),
('KEYBOARD002', 'Dell KB216', 'Wired multimedia keyboard', 'PCS', 800.00, 1200.00, 60, 15),
('MONITOR001', 'Dell 24" FHD Monitor', '24-inch Full HD LED monitor with IPS panel', 'PCS', 13000.00, 15000.00, 15, 3),
('MONITOR002', 'LG 27" 4K Monitor', '27-inch 4K UHD monitor', 'PCS', 28000.00, 32000.00, 8, 2),
('PRINTER001', 'HP LaserJet Pro M404n', 'Monochrome laser printer', 'PCS', 16000.00, 18000.00, 8, 2),
('PRINTER002', 'Canon Pixma G3000', 'Color inkjet printer with tank system', 'PCS', 12000.00, 14000.00, 12, 3),

-- Accessories
('CABLE001', 'USB-C to USB-A Cable', '1-meter USB-C to USB-A cable', 'PCS', 400.00, 500.00, 100, 20),
('CABLE002', 'HDMI Cable 2m', 'High-speed HDMI cable 2 meters', 'PCS', 300.00, 450.00, 80, 15),
('ADAPTER001', 'USB-C Power Adapter', '65W USB-C power adapter', 'PCS', 3000.00, 3500.00, 40, 10),
('ADAPTER002', 'USB Hub 4-Port', '4-port USB 3.0 hub', 'PCS', 800.00, 1200.00, 35, 8),
('HEADSET001', 'Jabra Evolve 40', 'Professional stereo headset with noise cancellation', 'PCS', 7500.00, 8500.00, 20, 5),
('HEADSET002', 'Logitech H390', 'USB headset with noise-cancelling mic', 'PCS', 2500.00, 3200.00, 30, 8),
('WEBCAM001', 'Logitech C920 HD Pro', 'Full HD 1080p webcam', 'PCS', 5500.00, 6500.00, 35, 8),
('WEBCAM002', 'Microsoft LifeCam HD', '720p HD webcam', 'PCS', 2800.00, 3500.00, 25, 6),

-- Mobile & Tablets
('TABLET001', 'iPad Air 64GB', 'Apple iPad Air with 64GB storage', 'PCS', 50000.00, 54000.00, 12, 3),
('TABLET002', 'Samsung Galaxy Tab S7', 'Android tablet with S Pen', 'PCS', 45000.00, 49000.00, 10, 2),
('PHONE001', 'iPhone 13 128GB', 'Apple iPhone 13 with 128GB storage', 'PCS', 65000.00, 72000.00, 8, 2),
('PHONE002', 'Samsung Galaxy S21', 'Android smartphone 128GB', 'PCS', 55000.00, 62000.00, 10, 2),

-- Office Supplies
('PAPER001', 'A4 Copy Paper', 'White A4 size copy paper 500 sheets', 'RM', 250.00, 350.00, 200, 50),
('PEN001', 'Ball Point Pen Blue', 'Blue ball point pen', 'BOX', 80.00, 120.00, 150, 30),
('NOTEBOOK001', 'Spiral Notebook A4', 'A4 size spiral notebook 200 pages', 'PCS', 80.00, 120.00, 100, 20),
('FOLDER001', 'File Folder', 'Plastic file folder', 'PCS', 30.00, 50.00, 200, 40),

-- Services
('DM001', 'Digital Marketing', 'Digital marketing services per month', 'PCS', 18000.00, 20000.00, 0, 0),
('WEB001', 'Website Development', 'Custom website development', 'PCS', 45000.00, 55000.00, 0, 0),
('SEO001', 'SEO Services', 'Search engine optimization monthly package', 'PCS', 15000.00, 18000.00, 0, 0),
('HR001', 'HR Consulting', 'Human resource consulting services', 'HR', 2000.00, 2500.00, 0, 0);

-- ============================================
-- 4. EXPENSES
-- ============================================
INSERT INTO expenses (amount, category, description, expense_date, payment_method) VALUES 
-- January 2025
(25000.00, 'Rent', 'Office rent for January 2025', '2025-01-01', 'bank_transfer'),
(3500.00, 'Utilities', 'Electricity bill for December 2024', '2025-01-05', 'bank_transfer'),
(2800.00, 'Utilities', 'Internet and phone bills', '2025-01-05', 'bank_transfer'),
(8000.00, 'Travel', 'Client meeting in Mumbai - flight and hotel', '2025-01-10', 'credit_card'),
(3500.00, 'Marketing', 'Google Ads campaign for January', '2025-01-12', 'credit_card'),
(1200.00, 'Office Supplies', 'Stationery and printing materials', '2025-01-15', 'cash'),
(15000.00, 'Professional Services', 'Legal consultation for contract review', '2025-01-18', 'bank_transfer'),
(4500.00, 'Equipment', 'Office chair and desk accessories', '2025-01-20', 'debit_card'),
(6000.00, 'Training', 'Employee training program - React Advanced', '2025-01-22', 'bank_transfer'),
(2800.00, 'Maintenance', 'AC servicing and office equipment maintenance', '2025-01-25', 'cash'),
(5500.00, 'Insurance', 'Office insurance premium', '2025-01-28', 'bank_transfer'),
(12000.00, 'Marketing', 'Social media marketing campaign', '2025-01-30', 'credit_card'),

-- December 2024
(25000.00, 'Rent', 'Office rent for December 2024', '2024-12-01', 'bank_transfer'),
(3200.00, 'Utilities', 'Electricity bill for November 2024', '2024-12-05', 'bank_transfer'),
(2500.00, 'Utilities', 'Internet and phone bills', '2024-12-05', 'bank_transfer'),
(15000.00, 'Travel', 'Team outing and year-end celebration', '2024-12-15', 'credit_card'),
(8000.00, 'Marketing', 'Year-end promotional campaign', '2024-12-20', 'credit_card'),
(4500.00, 'Office Supplies', 'Office supplies restocking', '2024-12-22', 'debit_card'),
(10000.00, 'Professional Services', 'Accounting services for year-end', '2024-12-28', 'bank_transfer');

-- ============================================
-- 5. PAYMENTS (from customers)
-- ============================================
-- Get customer IDs first, then insert payments
INSERT INTO payments (customer_id, amount, payment_date, payment_method, reference_number, notes) 
SELECT id, 50000.00, '2025-01-15', 'bank_transfer', 'NEFT250115001', 'Payment for Invoice INV-2025-001'
FROM customers WHERE email = 'contact@techinnovators.com';

INSERT INTO payments (customer_id, amount, payment_date, payment_method, reference_number, notes) 
SELECT id, 75000.00, '2025-01-18', 'upi', 'UPI250118001', 'Payment for website development'
FROM customers WHERE email = 'info@globalsolutions.com';

INSERT INTO payments (customer_id, amount, payment_date, payment_method, reference_number, notes) 
SELECT id, 35000.00, '2025-01-20', 'cheque', 'CHQ123456', 'Partial payment for project'
FROM customers WHERE email = 'sales@digitaldynamics.com';

INSERT INTO payments (customer_id, amount, payment_date, payment_method, reference_number, notes) 
SELECT id, 45000.00, '2025-01-22', 'bank_transfer', 'NEFT250122001', 'Payment for hardware purchase'
FROM customers WHERE email = 'hello@smartsystems.com';

INSERT INTO payments (customer_id, amount, payment_date, payment_method, reference_number, notes) 
SELECT id, 60000.00, '2025-01-25', 'upi', 'UPI250125001', 'Full payment for services'
FROM customers WHERE email = 'contact@futuretech.com';

INSERT INTO payments (customer_id, amount, payment_date, payment_method, reference_number, notes) 
SELECT id, 28000.00, '2024-12-15', 'bank_transfer', 'NEFT241215001', 'December payment'
FROM customers WHERE email = 'info@apexsolutions.com';

INSERT INTO payments (customer_id, amount, payment_date, payment_method, reference_number, notes) 
SELECT id, 42000.00, '2024-12-20', 'credit_card', 'CC241220001', 'Year-end payment'
FROM customers WHERE email = 'sales@primetech.com';

INSERT INTO payments (customer_id, amount, payment_date, payment_method, reference_number, notes) 
SELECT id, 55000.00, '2024-12-28', 'upi', 'UPI241228001', 'Final payment for 2024'
FROM customers WHERE email = 'contact@elitesystems.com';

-- ============================================
-- SUMMARY
-- ============================================
SELECT 'Data seeding completed successfully!' as message;
SELECT 'Customers' as table_name, COUNT(*) as count FROM customers
UNION ALL
SELECT 'Vendors', COUNT(*) FROM vendors
UNION ALL
SELECT 'Items', COUNT(*) FROM items
UNION ALL
SELECT 'Expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments;

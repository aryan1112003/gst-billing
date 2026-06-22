-- Create test payments for the system
-- Run this in MySQL/phpMyAdmin to add sample payment data

-- First, let's check if we have customers
SELECT id, name FROM customers LIMIT 5;

-- Insert sample payments (adjust customer_id based on your actual customer IDs)
INSERT INTO payments (customer_id, amount, payment_date, payment_method, reference_number, notes, created_at) VALUES
(1, 25000.00, '2025-01-15', 'bank_transfer', 'TXN123456', 'Payment for Invoice #INV-001', NOW()),
(2, 15000.00, '2025-01-14', 'upi', 'UPI789012', 'Partial payment received', NOW()),
(1, 8500.00, '2025-01-13', 'check', 'CHK345678', 'Check payment', NOW()),
(3, 12000.00, '2025-01-12', 'cash', 'CASH001', 'Cash payment received', NOW()),
(2, 30000.00, '2025-01-11', 'bank_transfer', 'TXN789456', 'Full payment for services', NOW()),
(4, 5500.00, '2025-01-10', 'upi', 'UPI456789', 'UPI payment', NOW()),
(1, 18000.00, '2025-01-09', 'credit_card', 'CC123789', 'Credit card payment', NOW()),
(3, 22000.00, '2025-01-08', 'bank_transfer', 'TXN456123', 'Bank transfer received', NOW()),
(5, 9500.00, '2025-01-07', 'cash', 'CASH002', 'Cash payment', NOW()),
(2, 16500.00, '2025-01-06', 'check', 'CHK789456', 'Check cleared', NOW());

-- Verify the payments were inserted
SELECT 
    p.id,
    c.name as customer_name,
    p.amount,
    p.payment_date,
    p.payment_method,
    p.reference_number,
    p.created_at
FROM payments p
JOIN customers c ON p.customer_id = c.id
ORDER BY p.payment_date DESC;

-- Check total payments
SELECT COUNT(*) as total_payments, SUM(amount) as total_amount FROM payments;

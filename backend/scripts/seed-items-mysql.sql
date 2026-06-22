-- Seed items for MySQL database

-- Insert sample items
INSERT INTO items (sku, name, description, unit, purchase_price, selling_price, current_stock, min_stock_level) VALUES 
('LAPTOP001', 'Dell Latitude 5520', 'Business laptop with Intel i5 processor', 'PCS', 60000.00, 65000.00, 25, 5),
('MOUSE001', 'Logitech MX Master 3', 'Wireless productivity mouse', 'PCS', 6500.00, 7500.00, 50, 10),
('KEYBOARD001', 'Logitech MX Keys', 'Wireless illuminated keyboard', 'PCS', 8500.00, 9500.00, 30, 8),
('MONITOR001', 'Dell 24" FHD Monitor', '24-inch Full HD LED monitor', 'PCS', 13000.00, 15000.00, 15, 3),
('PRINTER001', 'HP LaserJet Pro M404n', 'Monochrome laser printer', 'PCS', 16000.00, 18000.00, 8, 2),
('CABLE001', 'USB-C to USB-A Cable', '1-meter USB-C to USB-A cable', 'PCS', 400.00, 500.00, 100, 20),
('ADAPTER001', 'USB-C Power Adapter', '65W USB-C power adapter', 'PCS', 3000.00, 3500.00, 40, 10),
('HEADSET001', 'Jabra Evolve 40', 'Professional stereo headset', 'PCS', 7500.00, 8500.00, 20, 5),
('WEBCAM001', 'Logitech C920 HD Pro', 'Full HD 1080p webcam', 'PCS', 5500.00, 6500.00, 35, 8),
('TABLET001', 'iPad Air 64GB', 'Apple iPad Air with 64GB storage', 'PCS', 50000.00, 54000.00, 12, 3),
('DM001', 'Digital Marketing', 'Digital marketing services', 'PCS', 18000.00, 20000.00, 0, 0),
('ALTO001', 'ALTO-800 CUP TYPE MUD FLAP(001B)', 'Alto 800 cup type mud flap', 'PCS', 85.00, 98.00, 50, 10),
('ALTO002', 'alto o/m cup type mud flap(001A)', 'Alto old model cup type mud flap', 'PCS', 82.00, 95.00, 45, 10),
('OIL001', 'Engine Oil 5W-30', 'Synthetic engine oil 5W-30', 'DZ', 600.00, 699.00, 30, 5),
('HR001', 'HR Services', 'Human resource consulting services', 'LM', 90.00, 104.20, 0, 0);

SELECT 'Items seeded successfully!' as message;

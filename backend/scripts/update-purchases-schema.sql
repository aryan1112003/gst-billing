-- Add new columns to purchases table
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS place_of_supply VARCHAR(100),
ADD COLUMN IF NOT EXISTS eway_bill_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS purchase_invoice_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS purchase_invoice_date DATE,
ADD COLUMN IF NOT EXISTS terms_conditions TEXT;

-- Add new columns to purchase_items table
ALTER TABLE purchase_items
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS hsn_sac VARCHAR(50),
ADD COLUMN IF NOT EXISTS discount_rate DECIMAL(5,2) DEFAULT 0;

-- Update existing columns if needed
ALTER TABLE purchase_items
MODIFY COLUMN tax_rate DECIMAL(5,2) DEFAULT 18;

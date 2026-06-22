-- Add 'type' column to invoices table to support Quotations and Delivery Challans
ALTER TABLE invoices
ADD COLUMN type ENUM('invoice', 'quotation', 'challan') NOT NULL DEFAULT 'invoice' AFTER status;

-- Add index for performance on type filtering
CREATE INDEX idx_invoices_type ON invoices(type);

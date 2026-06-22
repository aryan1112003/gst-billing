-- ========================================
-- Multi-Tenant SaaS Platform Schema
-- ========================================

-- 1. Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  employee_limit INT NULL COMMENT 'NULL means unlimited',
  invoice_limit INT NULL COMMENT 'NULL means unlimited',
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  price_yearly DECIMAL(10,2) NULL,
  stripe_price_id VARCHAR(255) NULL COMMENT 'Stripe Price ID for recurring billing',
  features JSON COMMENT 'Array of feature strings',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active),
  INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id INT NOT NULL,
  plan_id INT NOT NULL,
  status ENUM('trial', 'active', 'past_due', 'cancelled', 'expired') DEFAULT 'trial',
  stripe_subscription_id VARCHAR(255) NULL,
  stripe_customer_id VARCHAR(255) NULL,
  trial_ends_at TIMESTAMP NULL,
  current_period_start TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  current_period_end TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
  INDEX idx_agency (agency_id),
  INDEX idx_status (status),
  INDEX idx_stripe_sub (stripe_subscription_id),
  INDEX idx_period_end (current_period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Usage Tracking Table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id INT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  invoice_count INT DEFAULT 0,
  employee_count INT DEFAULT 0,
  storage_used_mb DECIMAL(10,2) DEFAULT 0.00,
  api_calls INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_agency_period (agency_id, period_start),
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
  INDEX idx_period (period_start, period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id INT NOT NULL,
  subscription_id INT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  status ENUM('pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled') DEFAULT 'pending',
  payment_method VARCHAR(50) COMMENT 'card, upi, netbanking, etc',
  stripe_payment_intent_id VARCHAR(255) NULL,
  stripe_charge_id VARCHAR(255) NULL,
  stripe_invoice_id VARCHAR(255) NULL,
  failure_message TEXT NULL,
  metadata JSON COMMENT 'Additional payment details',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
  INDEX idx_agency (agency_id),
  INDEX idx_status (status),
  INDEX idx_stripe_pi (stripe_payment_intent_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Update Agencies Table
ALTER TABLE agencies 
  ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10) NULL,
  ADD COLUMN IF NOT EXISTS account_type ENUM('agency', 'user') DEFAULT 'agency',
  ADD COLUMN IF NOT EXISTS owner_user_id INT NULL COMMENT 'Primary owner/admin user',
  ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS invoice_count INT DEFAULT 0 COMMENT 'Total invoices created',
  ADD COLUMN IF NOT EXISTS employee_count INT DEFAULT 1 COMMENT 'Total active employees',
  ADD INDEX IF NOT EXISTS idx_owner (owner_user_id),
  ADD INDEX IF NOT EXISTS idx_trial (is_trial);

-- 6. Seed Default Subscription Plans
INSERT INTO subscription_plans (name, display_name, description, employee_limit, invoice_limit, price_monthly, price_yearly, features, sort_order) VALUES
(
  'free_trial', 
  'Free Trial', 
  'Perfect for testing the platform',
  4, 
  10, 
  0.00, 
  0.00,
  JSON_ARRAY('10 days trial', 'Up to 4 employees', 'Max 10 invoices', 'Email support', 'Basic features'),
  1
),
(
  'starter', 
  'Starter Plan', 
  'Ideal for small businesses',
  4, 
  NULL, 
  999.00, 
  9990.00,
  JSON_ARRAY('Up to 4 employees', 'Unlimited invoices', 'Email support', 'Basic analytics', 'Invoice templates', 'Mobile app access'),
  2
),
(
  'professional', 
  'Professional Plan', 
  'For growing businesses',
  10, 
  NULL, 
  2999.00, 
  29990.00,
  JSON_ARRAY('Up to 10 employees', 'Unlimited invoices', 'Priority support', 'Advanced analytics', 'Custom branding', 'API access', 'Export data', 'Multi-currency'),
  3
),
(
  'enterprise', 
  'Enterprise Plan', 
  'For large organizations',
  NULL, 
  NULL, 
  40000.00, 
  400000.00,
  JSON_ARRAY('Unlimited employees', 'Unlimited invoices', 'Dedicated support', 'Custom features', 'Advanced API access', 'Data migration support', 'Training sessions', 'SLA guarantee'),
  4
)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- Verify tables were created
SELECT 
  'subscription_plans' AS table_name, 
  COUNT(*) AS record_count 
FROM subscription_plans
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'usage_tracking', COUNT(*) FROM usage_tracking
UNION ALL
SELECT 'payment_transactions', COUNT(*) FROM payment_transactions;

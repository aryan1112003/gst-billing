/**
 * Migration runner — adds missing agency_id columns and creates new tables
 * Compatible with MariaDB and MySQL 8.0+
 * Usage: node scripts/run-migration.js
 */
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

// ── Load .env ────────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...rest] = line.trim().split('=');
    if (key && !key.startsWith('#') && rest.length)
      process.env[key] = rest.join('=').replace(/^["']|["']$/g, '');
  });
}

const dbCfg = {
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306'),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'mawebtec_lms',
  multipleStatements: true,
};

// ── Helpers ──────────────────────────────────────────────────────────────────
async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [dbCfg.database, table, column]
  );
  return rows.length > 0;
}

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [dbCfg.database, table]
  );
  return rows.length > 0;
}

async function addColumn(conn, table, colDef, label) {
  if (await columnExists(conn, table, label)) {
    console.log(`  ⏩ ${table}.${label} — already exists, skipped`);
    return;
  }
  await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN ${colDef}`);
  console.log(`  ✅ Added ${table}.${label}`);
}

async function createTable(conn, name, ddl) {
  if (await tableExists(conn, name)) {
    console.log(`  ⏩ Table '${name}' — already exists, skipped`);
    return;
  }
  await conn.query(ddl);
  console.log(`  ✅ Created table '${name}'`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log(`Connecting to ${dbCfg.host}:${dbCfg.port}/${dbCfg.database}...`);
  const conn = await mysql.createConnection(dbCfg);
  console.log('Connected.\n');

  // ── PART 1: Add missing agency_id columns ─────────────────────────────────
  console.log('── Part 1: agency_id columns ──────────────────────');
  const agencyCol = 'agency_id INT NOT NULL DEFAULT 1 AFTER id';

  await addColumn(conn, 'vendors',           agencyCol, 'agency_id');
  await addColumn(conn, 'items',             agencyCol, 'agency_id');
  await addColumn(conn, 'invoices',          agencyCol, 'agency_id');
  await addColumn(conn, 'expenses',          agencyCol, 'agency_id');
  await addColumn(conn, 'purchase',          agencyCol, 'agency_id');
  await addColumn(conn, 'payments_received', agencyCol, 'agency_id');

  // Add index on vendor agency_id if it doesn't already exist
  try {
    await conn.query('ALTER TABLE `vendors` ADD INDEX `idx_agency_id` (agency_id)');
    console.log('  ✅ Added index vendors.idx_agency_id');
  } catch (e) {
    if (e.code === 'ER_DUP_KEYNAME' || e.sqlMessage?.includes('Duplicate key name'))
      console.log('  ⏩ Index vendors.idx_agency_id — already exists, skipped');
    else throw e;
  }

  // ── PART 2: Create new tables ─────────────────────────────────────────────
  console.log('\n── Part 2: new tables ─────────────────────────────');

  await createTable(conn, 'gate_passes', `
    CREATE TABLE gate_passes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      gate_pass_number VARCHAR(50) UNIQUE NOT NULL,
      type ENUM('inward','outward') NOT NULL,
      party_name VARCHAR(255) NOT NULL,
      vehicle_number VARCHAR(50) NOT NULL,
      driver_name VARCHAR(255) NOT NULL,
      driver_phone VARCHAR(20) NOT NULL,
      purpose TEXT,
      items_description TEXT NOT NULL,
      quantity DECIMAL(15,2) NOT NULL,
      unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
      remarks TEXT,
      status ENUM('pending','approved','rejected','completed') DEFAULT 'pending',
      created_by INT NOT NULL,
      created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by INT DEFAULT NULL,
      updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_gate_pass_number (gate_pass_number),
      INDEX idx_type (type),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await createTable(conn, 'purchase_orders', `
    CREATE TABLE purchase_orders (
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
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await createTable(conn, 'production_orders', `
    CREATE TABLE production_orders (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await createTable(conn, 'bom_headers', `
    CREATE TABLE bom_headers (
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
      INDEX idx_bom_number (bom_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await createTable(conn, 'bom_items', `
    CREATE TABLE bom_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bom_id INT NOT NULL,
      component_name VARCHAR(255) NOT NULL,
      item_id INT,
      quantity DECIMAL(15,2) NOT NULL,
      unit VARCHAR(50) DEFAULT 'pcs',
      notes TEXT,
      INDEX idx_bom_id (bom_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await createTable(conn, 'recurring_invoices', `
    CREATE TABLE recurring_invoices (
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
      INDEX idx_next_date (next_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await createTable(conn, 'time_entries', `
    CREATE TABLE time_entries (
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
      INDEX idx_work_date (work_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await createTable(conn, 'projects', `
    CREATE TABLE projects (
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
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await createTable(conn, 'trip_sheets', `
    CREATE TABLE trip_sheets (
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
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await createTable(conn, 'vehicles', `
    CREATE TABLE vehicles (
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
      INDEX idx_vehicle_number (vehicle_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await createTable(conn, 'batches', `
    CREATE TABLE batches (
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
      INDEX idx_expiry (expiry_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await createTable(conn, 'customs_shipments', `
    CREATE TABLE customs_shipments (
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
      INDEX idx_shipment_number (shipment_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await createTable(conn, 'pos_sales', `
    CREATE TABLE pos_sales (
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
      INDEX idx_sale_date (sale_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ── PART 3: Add missing columns to existing tables ───────────────────────
  console.log('\n── Part 3: other missing columns ──────────────────');
  await addColumn(conn, 'expenses', 'receipt_url TEXT DEFAULT NULL', 'receipt_url');

  console.log('\n✅ Migration complete!');
  await conn.end();
}

run().catch(err => { console.error('\n❌ Fatal:', err.message); process.exit(1); });

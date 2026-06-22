const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTestInvoices() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mawebtec_lms'
    });

    console.log('✅ Connected to database');

    // Check if we have customers
    const [customers] = await connection.execute('SELECT id, name FROM customers LIMIT 5');
    
    if (customers.length === 0) {
      console.log('⚠️  No customers found. Creating a test customer...');
      
      await connection.execute(
        `INSERT INTO customers (name, email, phone, customer_type, display_name, gst_treatment, tax_preference, currency, payment_terms, enable_portal, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Test Customer', 'test@customer.com', '9876543210', 'business', 'Test Customer', 'registered_business_regular', 'taxable', 'INR', 30, 0, 1]
      );
      
      const [newCustomer] = await connection.execute('SELECT id, name FROM customers WHERE email = ?', ['test@customer.com']);
      customers.push(newCustomer[0]);
      console.log('✅ Created test customer');
    }

    // Check if we have items
    const [items] = await connection.execute('SELECT id, name, selling_price FROM items LIMIT 5');
    
    if (items.length === 0) {
      console.log('⚠️  No items found. Creating test items...');
      
      await connection.execute(
        `INSERT INTO items (sku, name, description, unit, selling_price, purchase_price, current_stock, min_stock_level, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['ITEM001', 'Test Product 1', 'Test product description', 'PCS', 1000, 800, 100, 10, 1]
      );
      
      await connection.execute(
        `INSERT INTO items (sku, name, description, unit, selling_price, purchase_price, current_stock, min_stock_level, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['ITEM002', 'Test Product 2', 'Another test product', 'PCS', 500, 400, 50, 5, 1]
      );
      
      const [newItems] = await connection.execute('SELECT id, name, selling_price FROM items WHERE sku IN (?, ?)', ['ITEM001', 'ITEM002']);
      items.push(...newItems);
      console.log('✅ Created test items');
    }

    console.log(`\n📦 Found ${customers.length} customers and ${items.length} items`);

    // Delete existing test invoices
    await connection.execute("DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE invoice_number LIKE 'TEST-%')");
    await connection.execute("DELETE FROM invoices WHERE invoice_number LIKE 'TEST-%'");
    console.log('✅ Deleted existing test invoices');

    // Create test invoices
    const invoiceStatuses = ['Draft', 'Pending', 'Paid', 'Overdue'];
    const invoicesCreated = [];

    for (let i = 1; i <= 5; i++) {
      const customer = customers[i % customers.length];
      const status = invoiceStatuses[i % invoiceStatuses.length];
      const invoiceNumber = `TEST-INV-${String(i).padStart(3, '0')}`;
      
      const issueDate = new Date();
      issueDate.setDate(issueDate.getDate() - (i * 5)); // Stagger dates
      
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 30);
      
      // Calculate amounts
      const item1 = items[0];
      const item2 = items[Math.min(1, items.length - 1)];
      
      const qty1 = i;
      const qty2 = i * 2;
      
      const subtotal = (item1.selling_price * qty1) + (item2.selling_price * qty2);
      const taxAmount = subtotal * 0.18; // 18% GST
      const discountAmount = i === 3 ? 100 : 0; // Discount on 3rd invoice
      const totalAmount = subtotal + taxAmount - discountAmount;
      const paidAmount = status === 'Paid' ? totalAmount : (status === 'Pending' ? totalAmount / 2 : 0);
      
      // Create invoice (using correct column names from schema)
      const [result] = await connection.execute(
        `INSERT INTO invoices (invoice_number, customer_id, invoice_date, due_date, subtotal, tax_amount, discount_amount, total_amount, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceNumber,
          customer.id,
          issueDate.toISOString().split('T')[0],
          dueDate.toISOString().split('T')[0],
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          status.toLowerCase(),
          `Test invoice ${i} - ${status}`
        ]
      );
      
      const invoiceId = result.insertId;
      
      // Create line items (using correct table and column names)
      await connection.execute(
        `INSERT INTO invoice_items (invoice_id, item_id, quantity, unit_price, tax_rate, discount_rate, total_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [invoiceId, item1.id, qty1, item1.selling_price, 18, 0, item1.selling_price * qty1]
      );
      
      await connection.execute(
        `INSERT INTO invoice_items (invoice_id, item_id, quantity, unit_price, tax_rate, discount_rate, total_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [invoiceId, item2.id, qty2, item2.selling_price, 18, 0, item2.selling_price * qty2]
      );
      
      invoicesCreated.push({
        number: invoiceNumber,
        customer: customer.name,
        amount: totalAmount,
        status: status
      });
      
      console.log(`✅ Created invoice ${invoiceNumber} - ${status} - ₹${totalAmount.toFixed(2)}`);
    }

    console.log('\n📋 Test Invoices Created:');
    console.table(invoicesCreated);

    console.log('\n🎉 Test invoices created successfully!');
    console.log('\n📝 Summary:');
    console.log(`   Total Invoices: ${invoicesCreated.length}`);
    console.log(`   Customers Used: ${customers.length}`);
    console.log(`   Items Used: ${items.length}`);
    console.log('\n✨ Refresh your Invoices page to see the data!');

  } catch (error) {
    console.error('❌ Error creating test invoices:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

// Run the script
createTestInvoices();

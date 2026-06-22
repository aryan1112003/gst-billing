import { pool } from '../config/database';

async function checkReportsData() {
  console.log('✅ Connected to database\n');
  console.log('Checking which reports have data...\n');
  console.log('='.repeat(60));

  const checks = [
    {
      name: 'Invoices',
      query: 'SELECT COUNT(*) as count FROM invoices WHERE is_deleted = 0',
      reports: ['Sales by Customer', 'Sales by Item', 'Invoice Details', 'Sales by Sales Person']
    },
    {
      name: 'Customers',
      query: 'SELECT COUNT(*) as count FROM customers',
      reports: ['Customer Balances', 'Sales by Customer', 'Aging Summary']
    },
    {
      name: 'Items',
      query: 'SELECT COUNT(*) as count FROM items',
      reports: ['Inventory Summary', 'Stock Summary', 'Sales by Item', 'Product Sales']
    },
    {
      name: 'Payments Received',
      query: 'SELECT COUNT(*) as count FROM payments_received',
      reports: ['Payments Received']
    },
    {
      name: 'Expenses',
      query: 'SELECT COUNT(*) as count FROM expenses',
      reports: ['Expense Details', 'Expenses by Category', 'Expenses by Customer']
    },
    {
      name: 'Vendors',
      query: 'SELECT COUNT(*) as count FROM vendors',
      reports: ['Vendor Balances', 'Purchase by Vendor', 'Vendor Payments']
    }
  ];

  const reportsWithData: string[] = [];

  for (const check of checks) {
    try {
      const [rows]: any = await pool.query(check.query);
      const count = rows[0].count;
      
      console.log(`\n📊 ${check.name}: ${count} records`);
      
      if (count > 0) {
        console.log(`   ✅ These reports will have data:`);
        check.reports.forEach(report => {
          console.log(`      - ${report}`);
          if (!reportsWithData.includes(report)) {
            reportsWithData.push(report);
          }
        });
      } else {
        console.log(`   ⚠️  No data - reports will be empty`);
      }
    } catch (error: any) {
      console.log(`   ❌ Table doesn't exist or error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 SUMMARY - Reports with data:');
  console.log('='.repeat(60));
  
  if (reportsWithData.length > 0) {
    reportsWithData.forEach((report, index) => {
      console.log(`${index + 1}. ${report}`);
    });
    console.log('\n💡 TIP: Try these reports first to test the new filters!');
  } else {
    console.log('⚠️  No reports have data yet. You need to add:');
    console.log('   - Customers');
    console.log('   - Items');
    console.log('   - Invoices');
  }

  console.log('\n' + '='.repeat(60));

  await pool.end();
  process.exit(0);
}

checkReportsData().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

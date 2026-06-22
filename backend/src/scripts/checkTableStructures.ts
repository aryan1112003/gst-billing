import { pool } from '../config/database';

async function checkTableStructures() {
  const tables = ['items', 'invoices', 'customers', 'expenses', 'vendors', 'payments_received', 'purchase'];
  
  for (const table of tables) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Table: ${table}`);
      console.log('='.repeat(60));
      const [rows]: any = await pool.query(`DESCRIBE ${table}`);
      console.table(rows.map((r: any) => ({ Field: r.Field, Type: r.Type, Null: r.Null, Key: r.Key })));
    } catch (error: any) {
      console.log(`❌ Table ${table} doesn't exist or error: ${error.message}`);
    }
  }
  
  await pool.end();
  process.exit(0);
}

checkTableStructures().catch(console.error);

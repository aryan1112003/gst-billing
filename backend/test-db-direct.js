// Quick test to see if database query works
const mysql = require('mysql2/promise');

async function test() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mawebtec_lms'
  });

  console.log('Connected to database!');

  // Test count query
  const [countRows] = await connection.query('SELECT COUNT(*) as count FROM customers WHERE 1=1');
  console.log('Count result:', countRows);
  console.log('Total customers:', countRows[0].count);

  // Test select query
  const [customerRows] = await connection.query(`
    SELECT 
      id, 
      CONCAT(fname, ' ', lname) as name,
      customer_email as email
    FROM customers 
    WHERE 1=1 
    ORDER BY fname ASC 
    LIMIT 5
  `);
  
  console.log('\nFirst 5 customers:');
  customerRows.forEach(c => {
    console.log(`- ${c.id}: ${c.name} (${c.email})`);
  });

  await connection.end();
}

test().catch(console.error);

const fs = require('fs');
const path = require('path');

// Files to fix
const files = [
  'src/routes/customers.ts',
  'src/routes/vendors.ts',
  'src/routes/items.ts',
  'src/routes/purchases.ts',
  'src/routes/invoices.ts',
  'src/routes/payments.ts',
  'src/routes/expenses.ts'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} - not found`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace PostgreSQL $1, $2, etc. with MySQL ?
  // This regex finds $1, $2, $3, etc. and replaces them with ?
  content = content.replace(/\$\d+/g, '?');
  
  // Replace RETURNING * with nothing (MySQL doesn't support RETURNING)
  content = content.replace(/\s+RETURNING \*/g, '');
  
  // Replace COALESCE with IFNULL for MySQL
  // Note: COALESCE works in MySQL too, so we'll keep it
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fixed ${file}`);
});

console.log('\n🎉 All files fixed!');

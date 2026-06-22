const fs = require('fs');

console.log('🔧 Fixing InvoiceController for MySQL...\n');

const filePath = 'src/controllers/invoiceController.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Count occurrences
const count = (content.match(/\$\d+/g) || []).length;
console.log(`Found ${count} PostgreSQL placeholders to replace\n`);

// Replace PostgreSQL placeholders with MySQL placeholders
// This is tricky because we need to replace $1, $2, $3... with ? in order
// We'll do a simple replacement since MySQL uses ? for all parameters

// Replace $1, $2, $3, etc. with ?
content = content.replace(/\$\d+/g, '?');

// Replace .rows with empty (MySQL doesn't use .rows)
content = content.replace(/\.rows\[0\]/g, '[0]');
content = content.replace(/\.rows\.length/g, '.length');
content = content.replace(/\.rows/g, '');

// Replace ANY($1) with IN (?) for MySQL
content = content.replace(/ANY\(\?\)/g, 'IN (?)');

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed InvoiceController!');
console.log('✅ Replaced PostgreSQL syntax with MySQL syntax');
console.log('\nPlease restart the backend server!');

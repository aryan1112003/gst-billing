const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING ALL POSTGRESQL SYNTAX TO MYSQL...\n');

const filesToFix = [
  'src/controllers/invoiceController.ts',
  'src/controllers/reportController.ts',
  'src/services/reportService.ts',
  'src/services/stockService.ts',
  'src/services/auditService.ts',
];

let totalFixed = 0;

filesToFix.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${filePath} (not found)`);
    return;
  }

  console.log(`📝 Processing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Count PostgreSQL placeholders
  const count = (content.match(/\$\d+/g) || []).length;
  
  if (count === 0) {
    console.log(`   ✓ Already migrated (no $1, $2 found)\n`);
    return;
  }
  
  console.log(`   Found ${count} PostgreSQL placeholders`);
  
  // 1. Replace $1, $2, $3, etc. with ?
  content = content.replace(/\$\d+/g, '?');
  
  // 2. Replace .rows with empty (MySQL doesn't use .rows)
  content = content.replace(/\.rows\[0\]/g, '[0]');
  content = content.replace(/\.rows\.length/g, '.length');
  content = content.replace(/\.rows/g, '');
  
  // 3. Replace ANY($1) with IN (?)
  content = content.replace(/ANY\(\?\)/g, 'IN (?)');
  
  // 4. Replace BEGIN with START TRANSACTION
  content = content.replace(/await query\('BEGIN'\)/g, "await query('START TRANSACTION')");
  content = content.replace(/await query\("BEGIN"\)/g, 'await query("START TRANSACTION")');
  
  // 5. Replace RETURNING * with empty (MySQL doesn't support RETURNING)
  content = content.replace(/RETURNING \*/g, '');
  
  // Write back
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`   ✅ Fixed!\n`);
    totalFixed++;
  } else {
    console.log(`   ⚠️  No changes needed\n`);
  }
});

console.log('═══════════════════════════════════════');
console.log(`✅ MIGRATION COMPLETE!`);
console.log(`📊 Files processed: ${filesToFix.length}`);
console.log(`✅ Files fixed: ${totalFixed}`);
console.log('═══════════════════════════════════════');
console.log('\n🚀 NEXT STEPS:');
console.log('1. Restart backend server');
console.log('2. Test all CRUD operations');
console.log('3. Check for any remaining errors\n');

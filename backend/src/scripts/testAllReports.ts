import { ReportService } from '../services/reportService';
import { pool } from '../config/database';

async function testAllReports() {
  console.log('\n' + '='.repeat(60));
  console.log('Testing All Report Methods');
  console.log('='.repeat(60) + '\n');

  const reports = [
    // Sales Reports
    { name: 'Sales by Customer', fn: () => ReportService.getSalesByCustomer() },
    { name: 'Sales by Item', fn: () => ReportService.getSalesByItem() },
    { name: 'Sales by Salesperson', fn: () => ReportService.getSalesBySalesperson() },
    
    // Receivables Reports
    { name: 'Customer Balances', fn: () => ReportService.getCustomerBalances() },
    { name: 'Aging Summary', fn: () => ReportService.getAgingSummary() },
    { name: 'Aging Details', fn: () => ReportService.getAgingDetails() },
    { name: 'Invoice Details', fn: () => ReportService.getInvoiceDetails() },
    
    // Payments Reports
    { name: 'Payments Received', fn: () => ReportService.getPaymentsReceived() },
    { name: 'Withholding Tax', fn: () => ReportService.getWithholdingTax() },
    
    // Expense Reports
    { name: 'Expense Details', fn: () => ReportService.getExpenseDetails() },
    { name: 'Expenses by Category', fn: () => ReportService.getExpensesByCategory() },
    { name: 'Expenses by Customer', fn: () => ReportService.getExpensesByCustomer() },
    
    // Inventory Reports
    { name: 'Inventory Summary', fn: () => ReportService.getInventorySummary() },
    { name: 'Inventory Valuation', fn: () => ReportService.getInventoryValuation() },
    { name: 'Stock Summary', fn: () => ReportService.getStockSummary() },
    { name: 'Product Sales', fn: () => ReportService.getProductSales() },
    
    // Financial Reports
    { name: 'Profit & Loss', fn: () => ReportService.getProfitLoss() },
    { name: 'Balance Sheet', fn: () => ReportService.getBalanceSheet() },
    { name: 'Cash Flow', fn: () => ReportService.getCashFlow() },
    { name: 'Trial Balance', fn: () => ReportService.getTrialBalance() },
    
    // Tax Reports
    { name: 'GST Summary', fn: () => ReportService.getGSTSummary() },
    { name: 'GSTR-1', fn: () => ReportService.getGSTR1() },
    { name: 'GSTR-2', fn: () => ReportService.getGSTR2() },
    { name: 'GSTR-3B', fn: () => ReportService.getGSTR3B() },
    { name: 'Tax Summary', fn: () => ReportService.getTaxSummary() },
    
    // Vendor Reports
    { name: 'Vendor Balances', fn: () => ReportService.getVendorBalances() },
    { name: 'Vendor Credits', fn: () => ReportService.getVendorCredits() },
    { name: 'Purchase by Vendor', fn: () => ReportService.getPurchaseByVendor() },
    { name: 'Vendor Payments', fn: () => ReportService.getVendorPayments() }
  ];

  let successCount = 0;
  let errorCount = 0;
  const errors: any[] = [];

  for (const report of reports) {
    try {
      const result = await report.fn();
      const hasData = result.rows ? result.rows.length > 0 : Object.keys(result).length > 0;
      
      if (hasData) {
        console.log(`✅ ${report.name.padEnd(30)} - ${result.rows ? result.rows.length + ' rows' : 'OK'}`);
      } else {
        console.log(`⚠️  ${report.name.padEnd(30)} - No data`);
      }
      successCount++;
    } catch (error: any) {
      console.log(`❌ ${report.name.padEnd(30)} - ERROR`);
      console.log(`   ${error.message}`);
      errorCount++;
      errors.push({ name: report.name, error: error.message });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`Total Reports: ${reports.length}`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('Failed Reports:');
    console.log('='.repeat(60));
    errors.forEach(err => {
      console.log(`\n❌ ${err.name}`);
      console.log(`   Error: ${err.error}`);
    });
  } else {
    console.log('\n🎉 All reports are working!');
  }

  await pool.end();
  process.exit(errorCount > 0 ? 1 : 0);
}

testAllReports().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

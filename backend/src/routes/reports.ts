import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ReportController } from '../controllers/reportController';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Dashboard
router.get('/dashboard', ReportController.getDashboardMetrics);

// Sales Reports
router.get('/sales', ReportController.getSalesReport);
router.get('/sales-by-customer', ReportController.getSalesByCustomer);
router.get('/sales-by-item', ReportController.getSalesByItem);
router.get('/sales-by-salesperson', ReportController.getSalesBySalesperson);

// Receivables Reports
router.get('/receivables', ReportController.getReceivablesReport);
router.get('/customer-balances', ReportController.getCustomerBalances);
router.get('/aging-summary', ReportController.getAgingSummary);
router.get('/aging-details', ReportController.getAgingDetails);
router.get('/invoice-details', ReportController.getInvoiceDetails);

// Payments Received Reports
router.get('/payments-received', ReportController.getPaymentsReceived);
router.get('/withholding-tax', ReportController.getWithholdingTax);

// Expenses Reports
router.get('/expenses', ReportController.getExpenseReport);
router.get('/expense-details', ReportController.getExpenseDetails);
router.get('/expenses-by-category', ReportController.getExpensesByCategory);
router.get('/expenses-by-customer', ReportController.getExpensesByCustomer);

// Inventory Reports
router.get('/inventory-summary', ReportController.getInventorySummary);
router.get('/inventory-valuation', ReportController.getInventoryValuation);
router.get('/stock-summary', ReportController.getStockSummary);
router.get('/product-sales', ReportController.getProductSales);

// Financial Reports
router.get('/profit-loss', ReportController.getProfitLoss);
router.get('/balance-sheet', ReportController.getBalanceSheet);
router.get('/cash-flow', ReportController.getCashFlow);
router.get('/trial-balance', ReportController.getTrialBalance);

// Tax Reports
router.get('/gst-summary', ReportController.getGSTSummary);
router.get('/gstr1', ReportController.getGSTR1);
router.get('/gstr2', ReportController.getGSTR2);
router.get('/gstr3b', ReportController.getGSTR3B);
router.get('/tax-summary', ReportController.getTaxSummary);

// Vendor Reports
router.get('/vendor-balances', ReportController.getVendorBalances);
router.get('/vendor-credits', ReportController.getVendorCredits);
router.get('/purchase-by-vendor', ReportController.getPurchaseByVendor);
router.get('/vendor-payments', ReportController.getVendorPayments);

// Summary & Top Reports
router.get('/top-customers', ReportController.getTopCustomers);
router.get('/top-items', ReportController.getTopItems);
router.get('/monthly-summary', ReportController.getMonthlySummary);

// Export Routes
router.get('/export/pdf/:reportType', ReportController.exportReportToPDF);
router.get('/export/excel/:reportType', ReportController.exportReportToExcel);

export default router;
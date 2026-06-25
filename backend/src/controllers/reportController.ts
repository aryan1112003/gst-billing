import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ReportService } from '../services/ReportService';
import { ExportService } from '../services/exportService';

export class ReportController {
  // Dashboard
  static getDashboardMetrics = asyncHandler(async (req: Request, res: Response) => {
    const metrics = await ReportService.getDashboardMetrics(req.agencyId ?? undefined);
    res.json({ success: true, data: { metrics } });
  });

  // Sales Reports
  static getSalesReport = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate, customerId } = req.query;
    const report = await ReportService.getSalesReport(
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      customerId as string,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  static getSalesByCustomer = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate } = req.query;
    const report = await ReportService.getSalesByCustomer(
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  static getSalesByItem = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate } = req.query;
    const report = await ReportService.getSalesByItem(
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  static getSalesBySalesperson = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate } = req.query;
    const report = await ReportService.getSalesBySalesperson(
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  // Receivables Reports
  static getReceivablesReport = asyncHandler(async (req: Request, res: Response) => {
    const report = await ReportService.getReceivablesReport(req.agencyId ?? undefined);
    res.json({ success: true, data: { report } });
  });

  static getCustomerBalances = asyncHandler(async (req: Request, res: Response) => {
    const report = await ReportService.getCustomerBalances(req.agencyId ?? undefined);
    res.json({ success: true, data: { report } });
  });

  static getAgingSummary = asyncHandler(async (req: Request, res: Response) => {
    const report = await ReportService.getAgingSummary(req.agencyId ?? undefined);
    res.json({ success: true, data: { report } });
  });

  static getAgingDetails = asyncHandler(async (req: Request, res: Response) => {
    const report = await ReportService.getAgingDetails(req.agencyId ?? undefined);
    res.json({ success: true, data: { report } });
  });

  static getInvoiceDetails = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate, status } = req.query;
    const report = await ReportService.getInvoiceDetails(
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      status as string,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  // Payments Received Reports
  static getPaymentsReceived = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate } = req.query;
    const report = await ReportService.getPaymentsReceived(
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  static getWithholdingTax = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate } = req.query;
    const report = await ReportService.getWithholdingTax(
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  // Expenses Reports
  static getExpenseReport = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate, category } = req.query;
    const report = await ReportService.getExpenseReport(
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      category as string,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  static getExpenseDetails = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate } = req.query;
    const report = await ReportService.getExpenseDetails(
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  static getExpensesByCategory = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate } = req.query;
    const report = await ReportService.getExpensesByCategory(
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  static getExpensesByCustomer = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate } = req.query;
    const report = await ReportService.getExpensesByCustomer(
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  // Inventory Reports
  static getInventorySummary = asyncHandler(async (req: Request, res: Response) => {
    const report = await ReportService.getInventorySummary(req.agencyId ?? undefined);
    res.json({ success: true, data: { report } });
  });

  static getInventoryValuation = asyncHandler(async (req: Request, res: Response) => {
    const report = await ReportService.getInventoryValuation(req.agencyId ?? undefined);
    res.json({ success: true, data: { report } });
  });

  static getStockSummary = asyncHandler(async (req: Request, res: Response) => {
    const report = await ReportService.getStockSummary(req.agencyId ?? undefined);
    res.json({ success: true, data: { report } });
  });

  static getProductSales = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate } = req.query;
    const report = await ReportService.getProductSales(
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  // Financial Reports
  static getProfitLoss = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate } = req.query;
    const report = await ReportService.getProfitLoss(
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  static getBalanceSheet = asyncHandler(async (req: Request, res: Response) => {
    const { asOfDate } = req.query;
    const report = await ReportService.getBalanceSheet(
      asOfDate ? new Date(asOfDate as string) : undefined,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  static getCashFlow = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate } = req.query;
    const report = await ReportService.getCashFlow(
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  static getTrialBalance = asyncHandler(async (req: Request, res: Response) => {
    const { asOfDate } = req.query;
    const report = await ReportService.getTrialBalance(
      asOfDate ? new Date(asOfDate as string) : undefined,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  // Tax Reports
  static getGSTSummary = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate } = req.query;
    const report = await ReportService.getGSTSummary(
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  static getGSTR1 = asyncHandler(async (req: Request, res: Response) => {
    const { month, year } = req.query;
    const report = await ReportService.getGSTR1(
      month ? parseInt(month as string) : undefined,
      year ? parseInt(year as string) : undefined,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  static getGSTR2 = asyncHandler(async (req: Request, res: Response) => {
    const { month, year } = req.query;
    const report = await ReportService.getGSTR2(
      month ? parseInt(month as string) : undefined,
      year ? parseInt(year as string) : undefined,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  static getGSTR3B = asyncHandler(async (req: Request, res: Response) => {
    const { month, year } = req.query;
    const report = await ReportService.getGSTR3B(
      month ? parseInt(month as string) : undefined,
      year ? parseInt(year as string) : undefined,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  static getTaxSummary = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate } = req.query;
    const report = await ReportService.getTaxSummary(
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  // Vendor Reports
  static getVendorBalances = asyncHandler(async (req: Request, res: Response) => {
    const report = await ReportService.getVendorBalances(req.agencyId ?? undefined);
    res.json({ success: true, data: { report } });
  });

  static getVendorCredits = asyncHandler(async (req: Request, res: Response) => {
    const report = await ReportService.getVendorCredits(req.agencyId ?? undefined);
    res.json({ success: true, data: { report } });
  });

  static getPurchaseByVendor = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate } = req.query;
    const report = await ReportService.getPurchaseByVendor(
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  static getVendorPayments = asyncHandler(async (req: Request, res: Response) => {
    const { fromDate, toDate } = req.query;
    const report = await ReportService.getVendorPayments(
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      req.agencyId ?? undefined
    );
    res.json({ success: true, data: { report } });
  });

  // Export Methods
  static exportReportToPDF = asyncHandler(async (req: Request, res: Response) => {
    const { reportType } = req.params;
    const { fromDate, toDate, customerId, status, category, month, year, asOfDate } = req.query;
    const agencyId = req.agencyId ?? undefined;

    let reportData: any;
    let reportTitle: string;

    // Get report data based on type
    switch (reportType) {
      case 'sales':
        reportData = await ReportService.getSalesReport(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          customerId as string,
          agencyId
        );
        reportTitle = 'Sales Report';
        break;

      case 'sales-by-customer':
        reportData = await ReportService.getSalesByCustomer(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Sales by Customer Report';
        break;

      case 'sales-by-item':
        reportData = await ReportService.getSalesByItem(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Sales by Item Report';
        break;

      case 'sales-by-salesperson':
        reportData = await ReportService.getSalesBySalesperson(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Sales by Salesperson Report';
        break;

      case 'receivables':
        reportData = await ReportService.getReceivablesReport(agencyId);
        reportTitle = 'Receivables Report';
        break;

      case 'customer-balances':
        reportData = await ReportService.getCustomerBalances(agencyId);
        reportTitle = 'Customer Balances Report';
        break;

      case 'aging-summary':
        reportData = await ReportService.getAgingSummary(agencyId);
        reportTitle = 'Aging Summary Report';
        break;

      case 'aging-details':
        reportData = await ReportService.getAgingDetails(agencyId);
        reportTitle = 'Aging Details Report';
        break;

      case 'invoice-details':
        reportData = await ReportService.getInvoiceDetails(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          status as string,
          agencyId
        );
        reportTitle = 'Invoice Details Report';
        break;

      case 'payments-received':
        reportData = await ReportService.getPaymentsReceived(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Payments Received Report';
        break;

      case 'withholding-tax':
        reportData = await ReportService.getWithholdingTax(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Withholding Tax Report';
        break;

      case 'expense-details':
        reportData = await ReportService.getExpenseDetails(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Expense Details Report';
        break;

      case 'expenses-by-category':
        reportData = await ReportService.getExpensesByCategory(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Expenses by Category Report';
        break;

      case 'expenses-by-customer':
        reportData = await ReportService.getExpensesByCustomer(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Expenses by Customer Report';
        break;

      case 'inventory-summary':
        reportData = await ReportService.getInventorySummary(agencyId);
        reportTitle = 'Inventory Summary Report';
        break;

      case 'inventory-valuation':
        reportData = await ReportService.getInventoryValuation(agencyId);
        reportTitle = 'Inventory Valuation Report';
        break;

      case 'stock-summary':
        reportData = await ReportService.getStockSummary(agencyId);
        reportTitle = 'Stock Summary Report';
        break;

      case 'product-sales':
        reportData = await ReportService.getProductSales(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Product Sales Report';
        break;

      case 'profit-loss':
        reportData = await ReportService.getProfitLoss(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Profit & Loss Report';
        break;

      case 'balance-sheet':
        reportData = await ReportService.getBalanceSheet(
          asOfDate ? new Date(asOfDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Balance Sheet Report';
        break;

      case 'cash-flow':
        reportData = await ReportService.getCashFlow(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Cash Flow Report';
        break;

      case 'trial-balance':
        reportData = await ReportService.getTrialBalance(
          asOfDate ? new Date(asOfDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Trial Balance Report';
        break;

      case 'gst-summary':
        reportData = await ReportService.getGSTSummary(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'GST Summary Report';
        break;

      case 'gstr1':
        reportData = await ReportService.getGSTR1(
          month ? parseInt(month as string) : undefined,
          year ? parseInt(year as string) : undefined,
          agencyId
        );
        reportTitle = 'GSTR-1 Report';
        break;

      case 'gstr2':
        reportData = await ReportService.getGSTR2(
          month ? parseInt(month as string) : undefined,
          year ? parseInt(year as string) : undefined,
          agencyId
        );
        reportTitle = 'GSTR-2 Report';
        break;

      case 'gstr3b':
        reportData = await ReportService.getGSTR3B(
          month ? parseInt(month as string) : undefined,
          year ? parseInt(year as string) : undefined,
          agencyId
        );
        reportTitle = 'GSTR-3B Report';
        break;

      case 'tax-summary':
        reportData = await ReportService.getTaxSummary(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Tax Summary Report';
        break;

      case 'vendor-balances':
        reportData = await ReportService.getVendorBalances(agencyId);
        reportTitle = 'Vendor Balances Report';
        break;

      case 'vendor-credits':
        reportData = await ReportService.getVendorCredits(agencyId);
        reportTitle = 'Vendor Credits Report';
        break;

      case 'purchase-by-vendor':
        reportData = await ReportService.getPurchaseByVendor(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Purchase By Vendor Report';
        break;

      case 'vendor-payments':
        reportData = await ReportService.getVendorPayments(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Vendor Payments Report';
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid report type' });
    }

    // Format filters
    const filters: any = {};
    if (fromDate) filters.fromDate = fromDate as string;
    if (toDate) filters.toDate = toDate as string;
    if (customerId) filters.customerId = customerId as string;
    if (status) filters.status = status as string;
    if (category) filters.category = category as string;
    if (month) filters.month = month as string;
    if (year) filters.year = year as string;
    if (asOfDate) filters.asOfDate = asOfDate as string;

    // Format data for export
    const exportData = ExportService.formatReportData(reportData, reportTitle, filters);

    // Export to PDF
    await ExportService.exportToPDF(exportData, res);
  });

  static exportReportToExcel = asyncHandler(async (req: Request, res: Response) => {
    const { reportType } = req.params;
    const { fromDate, toDate, customerId, status, category, month, year, asOfDate } = req.query;
    const agencyId = req.agencyId ?? undefined;

    let reportData: any;
    let reportTitle: string;

    // Get report data based on type (same logic as PDF export)
    switch (reportType) {
      case 'sales':
        reportData = await ReportService.getSalesReport(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          customerId as string,
          agencyId
        );
        reportTitle = 'Sales Report';
        break;

      case 'sales-by-customer':
        reportData = await ReportService.getSalesByCustomer(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Sales by Customer Report';
        break;

      case 'sales-by-item':
        reportData = await ReportService.getSalesByItem(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Sales by Item Report';
        break;

      case 'sales-by-salesperson':
        reportData = await ReportService.getSalesBySalesperson(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Sales by Salesperson Report';
        break;

      case 'receivables':
        reportData = await ReportService.getReceivablesReport(agencyId);
        reportTitle = 'Receivables Report';
        break;

      case 'customer-balances':
        reportData = await ReportService.getCustomerBalances(agencyId);
        reportTitle = 'Customer Balances Report';
        break;

      case 'aging-summary':
        reportData = await ReportService.getAgingSummary(agencyId);
        reportTitle = 'Aging Summary Report';
        break;

      case 'aging-details':
        reportData = await ReportService.getAgingDetails(agencyId);
        reportTitle = 'Aging Details Report';
        break;

      case 'invoice-details':
        reportData = await ReportService.getInvoiceDetails(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          status as string,
          agencyId
        );
        reportTitle = 'Invoice Details Report';
        break;

      case 'payments-received':
        reportData = await ReportService.getPaymentsReceived(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Payments Received Report';
        break;

      case 'withholding-tax':
        reportData = await ReportService.getWithholdingTax(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Withholding Tax Report';
        break;

      case 'expense-details':
        reportData = await ReportService.getExpenseDetails(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Expense Details Report';
        break;

      case 'expenses-by-category':
        reportData = await ReportService.getExpensesByCategory(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Expenses by Category Report';
        break;

      case 'expenses-by-customer':
        reportData = await ReportService.getExpensesByCustomer(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Expenses by Customer Report';
        break;

      case 'inventory-summary':
        reportData = await ReportService.getInventorySummary(agencyId);
        reportTitle = 'Inventory Summary Report';
        break;

      case 'inventory-valuation':
        reportData = await ReportService.getInventoryValuation(agencyId);
        reportTitle = 'Inventory Valuation Report';
        break;

      case 'stock-summary':
        reportData = await ReportService.getStockSummary(agencyId);
        reportTitle = 'Stock Summary Report';
        break;

      case 'product-sales':
        reportData = await ReportService.getProductSales(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Product Sales Report';
        break;

      case 'profit-loss':
        reportData = await ReportService.getProfitLoss(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Profit & Loss Report';
        break;

      case 'balance-sheet':
        reportData = await ReportService.getBalanceSheet(
          asOfDate ? new Date(asOfDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Balance Sheet Report';
        break;

      case 'cash-flow':
        reportData = await ReportService.getCashFlow(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Cash Flow Report';
        break;

      case 'trial-balance':
        reportData = await ReportService.getTrialBalance(
          asOfDate ? new Date(asOfDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Trial Balance Report';
        break;

      case 'gst-summary':
        reportData = await ReportService.getGSTSummary(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'GST Summary Report';
        break;

      case 'gstr1':
        reportData = await ReportService.getGSTR1(
          month ? parseInt(month as string) : undefined,
          year ? parseInt(year as string) : undefined,
          agencyId
        );
        reportTitle = 'GSTR-1 Report';
        break;

      case 'gstr2':
        reportData = await ReportService.getGSTR2(
          month ? parseInt(month as string) : undefined,
          year ? parseInt(year as string) : undefined,
          agencyId
        );
        reportTitle = 'GSTR-2 Report';
        break;

      case 'gstr3b':
        reportData = await ReportService.getGSTR3B(
          month ? parseInt(month as string) : undefined,
          year ? parseInt(year as string) : undefined,
          agencyId
        );
        reportTitle = 'GSTR-3B Report';
        break;

      case 'tax-summary':
        reportData = await ReportService.getTaxSummary(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Tax Summary Report';
        break;

      case 'vendor-balances':
        reportData = await ReportService.getVendorBalances(agencyId);
        reportTitle = 'Vendor Balances Report';
        break;

      case 'vendor-credits':
        reportData = await ReportService.getVendorCredits(agencyId);
        reportTitle = 'Vendor Credits Report';
        break;

      case 'purchase-by-vendor':
        reportData = await ReportService.getPurchaseByVendor(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Purchase By Vendor Report';
        break;

      case 'vendor-payments':
        reportData = await ReportService.getVendorPayments(
          fromDate ? new Date(fromDate as string) : undefined,
          toDate ? new Date(toDate as string) : undefined,
          agencyId
        );
        reportTitle = 'Vendor Payments Report';
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid report type' });
    }

    // Format filters
    const filters: any = {};
    if (fromDate) filters.fromDate = fromDate as string;
    if (toDate) filters.toDate = toDate as string;
    if (customerId) filters.customerId = customerId as string;
    if (status) filters.status = status as string;
    if (category) filters.category = category as string;
    if (month) filters.month = month as string;
    if (year) filters.year = year as string;
    if (asOfDate) filters.asOfDate = asOfDate as string;

    // Format data for export
    const exportData = ExportService.formatReportData(reportData, reportTitle, filters);

    // Export to Excel
    await ExportService.exportToExcel(exportData, res);
  });
}

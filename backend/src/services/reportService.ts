import { query } from '../config/database';
import { SalesReport, ReceivablesReport, ExpenseReport, DashboardMetrics } from '../types';

export class ReportService {
  // Dashboard Metrics (adapted for mawebtec_lms with multi-tenant support)
  static async getDashboardMetrics(agencyId?: number): Promise<DashboardMetrics> {
    try {
      // Customer count
      const customerParams: any[] = [];
      let customerWhere = `WHERE 1=1`;
      if (agencyId) { customerWhere += ` AND agency_id = ?`; customerParams.push(agencyId); }
      const customerResult = await query(`SELECT COUNT(*) as total_customers FROM customers ${customerWhere}`, customerParams);

      // Item count
      const itemParams: any[] = [];
      let itemWhere = `WHERE 1=1`;
      if (agencyId) { itemWhere += ` AND agency_id = ?`; itemParams.push(agencyId); }
      const itemResult = await query(`SELECT COUNT(*) as total_items FROM items ${itemWhere}`, itemParams);

      // Invoice stats â€” use is_deleted = 0 for PostgreSQL boolean
      const invoiceParams: any[] = [];
      let invoiceWhere = `WHERE is_deleted = 0`;
      if (agencyId) { invoiceWhere += ` AND agency_id = ?`; invoiceParams.push(agencyId); }
      const invoiceResult = await query(`
        SELECT COUNT(*) as total_invoices,
               COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
               COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_invoices,
               COALESCE(SUM(total_amount::numeric), 0) as total_sales,
               COALESCE(SUM(CASE WHEN status != 'paid' THEN total_amount::numeric ELSE 0 END), 0) as total_receivables
        FROM invoices
        ${invoiceWhere}
      `, invoiceParams);

      // Expenses this month
      let expenseResult;
      try {
        const expenseParams: any[] = [];
        let expenseWhere = `WHERE date >= DATE_TRUNC('month', CURRENT_DATE)`;
        if (agencyId) { expenseWhere += ` AND agency_id = ?`; expenseParams.push(agencyId); }
        expenseResult = await query(`
          SELECT COALESCE(SUM(COALESCE(total_amount, amount)::numeric), 0) as total_expenses
          FROM expenses
          ${expenseWhere}
        `, expenseParams);
      } catch (err) {
        expenseResult = { rows: [{ total_expenses: 0 }] };
      }

      // Recent invoice activities only (safe)
      let activitiesResult;
      try {
        const activitiesParams: any[] = [];
        let activitiesWhere = `WHERE is_deleted = 0`;
        if (agencyId) { activitiesWhere += ` AND agency_id = ?`; activitiesParams.push(agencyId); }
        activitiesResult = await query(`
          SELECT 'invoice' as type,
                 'Invoice ' || invoice_number || ' created' as description,
                 created_date as timestamp
          FROM invoices
          ${activitiesWhere}
          ORDER BY created_date DESC
          LIMIT 10
        `, activitiesParams);
      } catch (err) {
        activitiesResult = { rows: [] };
      }

      return {
        totalCustomers: parseInt(customerResult.rows[0]?.total_customers) || 0,
        activeCustomers: parseInt(customerResult.rows[0]?.total_customers) || 0,
        totalItems: parseInt(itemResult.rows[0]?.total_items) || 0,
        lowStockItems: 0,
        totalInvoices: parseInt(invoiceResult.rows[0]?.total_invoices) || 0,
        paidInvoices: parseInt(invoiceResult.rows[0]?.paid_invoices) || 0,
        overdueInvoices: parseInt(invoiceResult.rows[0]?.overdue_invoices) || 0,
        totalSales: parseFloat(invoiceResult.rows[0]?.total_sales) || 0,
        totalReceivables: parseFloat(invoiceResult.rows[0]?.total_receivables) || 0,
        totalExpenses: parseFloat((expenseResult as any).rows?.[0]?.total_expenses) || 0,
        recentActivities: ((activitiesResult as any).rows || []).map((row: any) => ({
          type: row.type,
          description: row.description,
          timestamp: row.timestamp
        }))
      };
    } catch (error) {
      console.error('Error in getDashboardMetrics:', error);
      return {
        totalCustomers: 0,
        activeCustomers: 0,
        totalItems: 0,
        lowStockItems: 0,
        totalInvoices: 0,
        paidInvoices: 0,
        overdueInvoices: 0,
        totalSales: 0,
        totalReceivables: 0,
        totalExpenses: 0,
        recentActivities: []
      };
    }
  }

  // Sales Reports (adapted for mawebtec_lms with multi-tenant support)
  static async getSalesReport(fromDate?: Date, toDate?: Date, customerId?: string, agencyId?: number): Promise<SalesReport> {
    const params: any[] = [];
    let whereClause = `WHERE i.is_deleted = 0`;

    if (fromDate) {
      whereClause += ` AND i.invoice_date >= ?`;
      params.push(fromDate);
    }
    if (toDate) {
      whereClause += ` AND i.invoice_date <= ?`;
      params.push(toDate);
    }
    if (customerId) {
      whereClause += ` AND i.customer_id = ?`;
      params.push(customerId);
    }
    if (agencyId) {
      whereClause += ` AND i.agency_id = ?`;
      params.push(agencyId);
    }

    const salesResult = await query(`
      SELECT COALESCE(SUM(CAST(total_amount AS NUMERIC)), 0) as total_sales, 
             COUNT(*) as total_invoices, 
             COALESCE(AVG(CAST(total_amount AS NUMERIC)), 0) as average_invoice_value 
      FROM invoices i ${whereClause}
    `, params);

    const topCustomersResult = await query(`
      SELECT c.id as customer_id, 
             CONCAT(c.fname, ' ', c.lname) as customer_name, 
             COALESCE(SUM(CAST(i.total_amount AS NUMERIC)), 0) as total_sales, 
             COUNT(i.id) as invoice_count 
      FROM customers c 
      JOIN invoices i ON c.id = i.customer_id 
      ${whereClause} 
      GROUP BY c.id, c.fname, c.lname 
      ORDER BY total_sales DESC 
      LIMIT 10
    `, params);

    const byMonthParams: any[] = [];
    let byMonthWhere = `WHERE i.is_deleted = 0 AND i.invoice_date >= CURRENT_DATE - INTERVAL '11 months'`;
    if (agencyId) { byMonthWhere += ` AND i.agency_id = ?`; byMonthParams.push(agencyId); }
    const salesByMonthResult = await query(`
      SELECT TO_CHAR(i.invoice_date, 'YYYY-MM') as month,
             COALESCE(SUM(CAST(i.total_amount AS NUMERIC)), 0) as sales,
             COUNT(i.id) as invoices
      FROM invoices i
      ${byMonthWhere}
      GROUP BY TO_CHAR(i.invoice_date, 'YYYY-MM')
      ORDER BY month
    `, byMonthParams);

    return {
      totalSales: parseFloat(salesResult.rows[0].total_sales) || 0,
      totalInvoices: parseInt(salesResult.rows[0].total_invoices) || 0,
      averageInvoiceValue: parseFloat(salesResult.rows[0].average_invoice_value) || 0,
      topCustomers: topCustomersResult.rows.map((row: any) => ({
        customerId: row.customer_id,
        customerName: row.customer_name,
        totalSales: parseFloat(row.total_sales) || 0,
        invoiceCount: parseInt(row.invoice_count) || 0
      })),
      salesByMonth: salesByMonthResult.rows.map((row: any) => ({
        month: row.month,
        sales: parseFloat(row.sales) || 0,
        invoices: parseInt(row.invoices) || 0
      }))
    };
  }

  static async getSalesByCustomer(fromDate?: Date, toDate?: Date, agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE i.is_deleted = 0`;
    if (fromDate) { whereClause += ` AND i.invoice_date >= ?`; params.push(fromDate); }
    if (toDate) { whereClause += ` AND i.invoice_date <= ?`; params.push(toDate); }
    if (agencyId) {
      whereClause += ` AND i.agency_id = ? AND c.agency_id = ?`;
      params.push(agencyId, agencyId);
    }

    const result = await query(`
      SELECT CONCAT(c.fname, ' ', c.lname) as "Customer Name",
             COUNT(i.id) as "Invoice Count",
             COALESCE(SUM(CAST(i.total_amount AS NUMERIC)), 0) as "Total Sales",
             COALESCE(SUM(CAST(i.total_amount AS NUMERIC)), 0) as "Sales with Tax"
      FROM customers c
      JOIN invoices i ON c.id = i.customer_id
      ${whereClause}
      GROUP BY c.id, c.fname, c.lname
      ORDER BY "Total Sales" DESC
    `, params);

    return result;
  }

  static async getSalesByItem(fromDate?: Date, toDate?: Date, agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE 1=1`;
    if (fromDate) { whereClause += ` AND invoice_date >= ?`; params.push(fromDate); }
    if (toDate) { whereClause += ` AND invoice_date <= ?`; params.push(toDate); }
    if (agencyId) { whereClause += ` AND agency_id = ?`; params.push(agencyId); }

    const result = await query(`
      SELECT name as "Item Name", 
             SUM(total_qty) as "Quantity Sold",
             COALESCE(SUM(CAST(total_amount AS NUMERIC)), 0) as "Total Sales"
      FROM item_qty_sale_view
      ${whereClause}
      GROUP BY item_id, name
      ORDER BY "Total Sales" DESC
    `, params);

    return result;
  }

  static async getSalesBySalesperson(fromDate?: Date, toDate?: Date, agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE i.is_deleted = 0`;
    if (fromDate) { whereClause += ` AND i.invoice_date >= ?`; params.push(fromDate); }
    if (toDate) { whereClause += ` AND i.invoice_date <= ?`; params.push(toDate); }
    if (agencyId) {
      whereClause += ` AND i.agency_id = ? AND s.agency_id = ?`;
      params.push(agencyId, agencyId);
    }

    const result = await query(`
      SELECT s.name as "Salesperson",
             COUNT(i.id) as "Invoice Count",
             COALESCE(SUM(CAST(i.total_amount AS NUMERIC)), 0) as "Total Sales"
      FROM sale_persons s
      JOIN invoices i ON s.id = i.saleperson_id
      ${whereClause}
      GROUP BY s.id, s.name
      ORDER BY "Total Sales" DESC
    `, params);

    return result;
  }

  // Receivables Reports (simplified for mawebtec_lms)
  static async getReceivablesReport(agencyId?: number): Promise<ReceivablesReport> {
    const params: any[] = [];
    let whereClause = `WHERE is_deleted = 0 AND status != 'paid'`;
    if (agencyId) { whereClause += ` AND agency_id = ?`; params.push(agencyId); }
    // Simplified - mawebtec_lms doesn't have paid_amount in invoices
    const receivablesResult = await query(`
      SELECT COALESCE(SUM(CAST(total_amount AS NUMERIC)), 0) as total_receivables,
             0 as overdue_amount,
             COALESCE(SUM(CAST(total_amount AS NUMERIC)), 0) as current_amount
      FROM invoices
      ${whereClause}
    `, params);

    return {
      totalReceivables: parseFloat(receivablesResult.rows[0].total_receivables) || 0,
      overdueAmount: parseFloat(receivablesResult.rows[0].overdue_amount) || 0,
      currentAmount: parseFloat(receivablesResult.rows[0].current_amount) || 0,
      agingBuckets: [],
      topDebtors: []
    };
  }

  static async getCustomerBalances(agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE 1=1`;
    if (agencyId) { whereClause += ` AND c.agency_id = ?`; params.push(agencyId); }
    const result = await query(`
      SELECT CONCAT(c.fname, ' ', c.lname) as name,
             COALESCE(SUM(CAST(i.total_amount AS NUMERIC)), 0) as balance
      FROM customers c
      LEFT JOIN invoices i ON c.id = i.customer_id AND i.is_deleted = 0 AND i.status != 'paid'
      ${whereClause}
      GROUP BY c.id, c.fname, c.lname
      HAVING COALESCE(SUM(CAST(i.total_amount AS NUMERIC)), 0) > 0
      ORDER BY COALESCE(SUM(CAST(i.total_amount AS NUMERIC)), 0) DESC
    `, params);
    return result;
  }

  static async getAgingSummary(agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE i.is_deleted = 0 AND i.status != 'paid'`;
    if (agencyId) { whereClause += ` AND i.agency_id = ?`; params.push(agencyId); }
    const result = await query(`
      SELECT
        SUM(CASE WHEN (CURRENT_DATE - i.due_date::date) <= 0 THEN CAST(i.total_amount AS NUMERIC) ELSE 0 END) as current_amount,
        SUM(CASE WHEN (CURRENT_DATE - i.due_date::date) BETWEEN 1 AND 30 THEN CAST(i.total_amount AS NUMERIC) ELSE 0 END) as days_1_30,
        SUM(CASE WHEN (CURRENT_DATE - i.due_date::date) BETWEEN 31 AND 60 THEN CAST(i.total_amount AS NUMERIC) ELSE 0 END) as days_31_60,
        SUM(CASE WHEN (CURRENT_DATE - i.due_date::date) BETWEEN 61 AND 90 THEN CAST(i.total_amount AS NUMERIC) ELSE 0 END) as days_61_90,
        SUM(CASE WHEN (CURRENT_DATE - i.due_date::date) > 90 THEN CAST(i.total_amount AS NUMERIC) ELSE 0 END) as days_over_90
      FROM invoices i
      ${whereClause}
    `, params);

    return result;
  }

  static async getAgingDetails(agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE i.is_deleted = 0 AND i.status != 'paid'`;
    if (agencyId) { whereClause += ` AND i.agency_id = ?`; params.push(agencyId); }
    const result = await query(`
      SELECT i.invoice_number,
             CONCAT(c.fname, ' ', c.lname) as customer_name,
             i.invoice_date,
             i.due_date,
             (CURRENT_DATE - i.due_date::date) as days_overdue,
             CAST(i.total_amount AS NUMERIC) as amount,
             CASE
               WHEN (CURRENT_DATE - i.due_date::date) <= 0 THEN 'Current'
               WHEN (CURRENT_DATE - i.due_date::date) BETWEEN 1 AND 30 THEN '1-30 Days'
               WHEN (CURRENT_DATE - i.due_date::date) BETWEEN 31 AND 60 THEN '31-60 Days'
               WHEN (CURRENT_DATE - i.due_date::date) BETWEEN 61 AND 90 THEN '61-90 Days'
               ELSE 'Over 90 Days'
             END as aging_bucket
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      ${whereClause}
      ORDER BY days_overdue DESC
    `, params);

    return result;
  }

  static async getInvoiceDetails(fromDate?: Date, toDate?: Date, status?: string, agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE i.is_deleted = 0`;
    if (fromDate) { whereClause += ` AND i.invoice_date >= ?`; params.push(fromDate); }
    if (toDate) { whereClause += ` AND i.invoice_date <= ?`; params.push(toDate); }
    if (status) { whereClause += ` AND i.status = ?`; params.push(status); }
    if (agencyId) { whereClause += ` AND i.agency_id = ?`; params.push(agencyId); }

    const result = await query(`
      SELECT i.invoice_number, 
             CONCAT(c.fname, ' ', c.lname) as customer, 
             i.invoice_date as issue_date, 
             i.due_date, 
             i.status, 
             CAST(i.total_amount AS NUMERIC) as total_amount, 
             0 as paid_amount, 
             CAST(i.total_amount AS NUMERIC) as balance 
      FROM invoices i 
      JOIN customers c ON i.customer_id = c.id 
      ${whereClause} 
      ORDER BY i.invoice_date DESC
    `, params);

    return result;
  }

  // Payment Reports
  static async getPaymentsReceived(fromDate?: Date, toDate?: Date, agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE 1=1`;
    if (fromDate) { whereClause += ` AND p.payment_date >= ?`; params.push(fromDate); }
    if (toDate) { whereClause += ` AND p.payment_date <= ?`; params.push(toDate); }
    if (agencyId) { whereClause += ` AND p.agency_id = ?`; params.push(agencyId); }

    const result = await query(`
      SELECT p.payment_date, 
             CONCAT(c.fname, ' ', c.lname) as customer, 
             p.reference, 
             CAST(p.amount AS NUMERIC) as amount,
             p.payment_mode as payment_method
      FROM payments_received p 
      JOIN customers c ON p.customer_id = c.id 
      ${whereClause} 
      ORDER BY p.payment_date DESC
    `, params);

    return result;
  }

  static async getWithholdingTax(fromDate?: Date, toDate?: Date, agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE p.tax_deducted = true`;
    if (fromDate) { whereClause += ` AND p.payment_date >= ?`; params.push(fromDate); }
    if (toDate) { whereClause += ` AND p.payment_date <= ?`; params.push(toDate); }
    if (agencyId) { whereClause += ` AND p.agency_id = ?`; params.push(agencyId); }

    const result = await query(`
      SELECT 
        p.payment_date,
        CONCAT(c.fname, ' ', c.lname) as customer_name,
        p.reference,
        CAST(p.amount AS NUMERIC) as payment_amount,
        CAST(p.withholding_amount AS NUMERIC) as tds_amount,
        CAST(p.amount_received AS NUMERIC) as net_amount
      FROM payments_received p
      JOIN customers c ON p.customer_id = c.id
      ${whereClause}
      ORDER BY p.payment_date DESC
    `, params);

    return result;
  }

  // Expense Reports
  static async getExpenseReport(fromDate?: Date, toDate?: Date, category?: string, agencyId?: number): Promise<ExpenseReport> {
    return {
      totalExpenses: 0,
      billableExpenses: 0,
      nonBillableExpenses: 0,
      expensesByCategory: [],
      expensesByMonth: []
    };
  }

  static async getExpenseDetails(fromDate?: Date, toDate?: Date, agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE 1=1`;
    if (fromDate) { whereClause += ` AND e.date >= ?`; params.push(fromDate); }
    if (toDate) { whereClause += ` AND e.date <= ?`; params.push(toDate); }
    if (agencyId) { whereClause += ` AND e.agency_id = ?`; params.push(agencyId); }

    const result = await query(`
      SELECT e.date as date,
             e.notes as description,
             CAST(COALESCE(e.total_amount, e.amount) AS NUMERIC) as amount,
             CAST(COALESCE(e.total_amount, e.amount) AS NUMERIC) as total_amount,
             e.category_id as category
      FROM expenses e
      ${whereClause}
      ORDER BY e.date DESC
    `, params);

    return result;
  }

  static async getExpensesByCategory(fromDate?: Date, toDate?: Date, agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE 1=1`;
    if (fromDate) { whereClause += ` AND e.date >= ?`; params.push(fromDate); }
    if (toDate) { whereClause += ` AND e.date <= ?`; params.push(toDate); }
    if (agencyId) { whereClause += ` AND e.agency_id = ?`; params.push(agencyId); }

    const result = await query(`
      SELECT COALESCE(e.category_id::text, 'Uncategorized') as category,
             COUNT(*) as expense_count,
             COALESCE(SUM(CAST(COALESCE(e.total_amount, e.amount) AS NUMERIC)), 0) as total_amount
      FROM expenses e
      ${whereClause}
      GROUP BY e.category_id
      ORDER BY total_amount DESC
    `, params);

    return result;
  }

  static async getExpensesByCustomer(fromDate?: Date, toDate?: Date, agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE 1=1`;
    if (fromDate) { whereClause += ` AND e.date >= ?`; params.push(fromDate); }
    if (toDate) { whereClause += ` AND e.date <= ?`; params.push(toDate); }

    // Group expenses by category as proxy for "by customer" since new schema removed customer_id from expenses
    const result = await query(`
      SELECT COALESCE(e.category_id::text, 'Uncategorized') as customer_name,
             COUNT(*) as expense_count,
             COALESCE(SUM(CAST(COALESCE(e.total_amount, e.amount) AS NUMERIC)), 0) as total_amount
      FROM expenses e
      ${whereClause}
      GROUP BY e.category_id
      ORDER BY total_amount DESC
    `, params);

    return result;
  }

  // Inventory Reports
  static async getInventorySummary(agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE 1=1`;
    if (agencyId) { whereClause += ` AND agency_id = ?`; params.push(agencyId); }
    const result = await query(`
      SELECT name as item_name,
             hsncode as hsn_code,
             CAST(selling_price AS NUMERIC) as unit_price,
             description
      FROM items
      ${whereClause}
      ORDER BY name
    `, params);

    return result;
  }

  static async getInventoryValuation(agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE 1=1`;
    if (agencyId) { whereClause += ` AND agency_id = ?`; params.push(agencyId); }
    const result = await query(`
      SELECT COUNT(*) as total_items,
             COALESCE(SUM(CAST(selling_price AS NUMERIC)), 0) as total_value
      FROM items
      ${whereClause}
    `, params);

    return result;
  }

  static async getStockSummary(agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE 1=1`;
    if (agencyId) { whereClause += ` AND agency_id = ?`; params.push(agencyId); }
    const result = await query(`
      SELECT name as item_name,
             hsncode as hsn_code,
             CAST(selling_price AS NUMERIC) as unit_price,
             description,
             'Available' as status
      FROM items
      ${whereClause}
      ORDER BY name
    `, params);

    return result;
  }

  static async getProductSales(fromDate?: Date, toDate?: Date, agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE 1=1`;
    if (agencyId) { whereClause += ` AND it.agency_id = ?`; params.push(agencyId); }
    // Product sales - simplified version showing all items
    const result = await query(`
      SELECT it.name as product_name,
             it.hsncode as hsn_code,
             CAST(it.selling_price AS NUMERIC) as unit_price,
             it.description
      FROM items it
      ${whereClause}
      ORDER BY it.name
    `, params);

    return result;
  }


  static async getProfitLoss(fromDate?: Date, toDate?: Date, agencyId?: number) {
    const incomeParams = [];
    const expenseParams = [];
    let incWhere = `WHERE is_deleted = 0`;
    let expWhere = `WHERE 1=1`;

    if (fromDate) { incWhere += ` AND invoice_date >= ?`; incomeParams.push(fromDate); }
    if (toDate) { incWhere += ` AND invoice_date <= ?`; incomeParams.push(toDate); }
    if (agencyId) { incWhere += ` AND agency_id = ?`; incomeParams.push(agencyId); }

    if (fromDate) { expWhere += ` AND date >= ?`; expenseParams.push(fromDate); }
    if (toDate) { expWhere += ` AND date <= ?`; expenseParams.push(toDate); }
    if (agencyId) { expWhere += ` AND agency_id = ?`; expenseParams.push(agencyId); }

    const incomeRes = await query(`SELECT COALESCE(SUM(CAST(total_amount AS NUMERIC)), 0) as total_income FROM invoices ${incWhere}`, incomeParams);
    const expenseRes = await query(`SELECT COALESCE(SUM(COALESCE(total_amount, amount)::numeric), 0) as total_expenses FROM expenses ${expWhere}`, expenseParams);

    const totalIncome = parseFloat(incomeRes.rows[0].total_income) || 0;
    const totalExpenses = parseFloat(expenseRes.rows[0].total_expenses) || 0;

    return {
      income: {
        totalIncome,
        breakdown: [
          { category: 'Sales', amount: totalIncome }
        ]
      },
      expenses: {
        totalExpenses,
        breakdown: [
          { category: 'Operating Expenses', amount: totalExpenses }
        ]
      },
      netProfit: totalIncome - totalExpenses
    };
  }

  static async getBalanceSheet(asOfDate?: Date, agencyId?: number) {
    // Simplified Balance Sheet
    const invoiceParams: any[] = [];
    const purchaseParams: any[] = [];
    let whereClause = `WHERE is_deleted = 0`;
    let purchaseWhere = `WHERE is_deleted = 0`;

    if (asOfDate) {
      whereClause += ` AND invoice_date <= ?`;
      purchaseWhere += ` AND purchase_date <= ?`;
      invoiceParams.push(asOfDate);
      purchaseParams.push(asOfDate);
    }
    if (agencyId) {
      whereClause += ` AND agency_id = ?`;
      purchaseWhere += ` AND agency_id = ?`;
      invoiceParams.push(agencyId);
      purchaseParams.push(agencyId);
    }

    const receivablesResult = await query(`SELECT COALESCE(SUM(CAST(total_amount AS NUMERIC)), 0) as total FROM invoices ${whereClause} AND status != 'paid'`, invoiceParams);
    const payablesResult = await query(`SELECT COALESCE(SUM(CAST(total_amount AS NUMERIC)), 0) as total FROM purchase ${purchaseWhere} AND status != 'paid'`, purchaseParams);

    // Bank balance (approximation from payments received - expenses)
    const payRecParams: any[] = [];
    let payRecWhere = `WHERE 1=1`;
    if (asOfDate) { payRecWhere += ` AND payment_date <= ?`; payRecParams.push(asOfDate); }
    if (agencyId) { payRecWhere += ` AND agency_id = ?`; payRecParams.push(agencyId); }

    const expRecParams: any[] = [];
    let expRecWhere = `WHERE 1=1`;
    if (asOfDate) { expRecWhere += ` AND date <= ?`; expRecParams.push(asOfDate); }
    if (agencyId) { expRecWhere += ` AND agency_id = ?`; expRecParams.push(agencyId); }

    const paymentsResult = await query(`SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as total FROM payments_received ${payRecWhere}`, payRecParams);
    const expensesResult = await query(`SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as total FROM expenses ${expRecWhere}`, expRecParams);

    const totalReceivables = parseFloat(receivablesResult.rows[0].total) || 0;
    const totalPayables = parseFloat(payablesResult.rows[0].total) || 0;
    const cashAndBank = (parseFloat(paymentsResult.rows[0].total) || 0) - (parseFloat(expensesResult.rows[0].total) || 0);

    return {
      assets: {
        currentAssets: {
          cashAndBank,
          accountsReceivable: totalReceivables,
          inventory: 0 // TODO: Calculate inventory value
        },
        fixedAssets: {
          total: 0
        },
        totalAssets: cashAndBank + totalReceivables
      },
      liabilities: {
        currentLiabilities: {
          accountsPayable: totalPayables,
          taxPayable: 0
        },
        longTermLiabilities: {
          total: 0
        },
        totalLiabilities: totalPayables
      },
      equity: {
        total: (cashAndBank + totalReceivables) - totalPayables
      }
    };
  }

  static async getCashFlow(fromDate?: Date, toDate?: Date, agencyId?: number) {
    return {
      operatingActivities: { netCash: 0, breakdown: [] },
      investingActivities: { netCash: 0, breakdown: [] },
      financingActivities: { netCash: 0, breakdown: [] },
      netCashFlow: 0
    };
  }

  static async getTrialBalance(asOfDate?: Date, agencyId?: number) {
    return {
      debits: [],
      credits: [],
      totalDebits: 0,
      totalCredits: 0
    };
  }

  // Tax Reports
  static async getGSTSummary(fromDate?: Date, toDate?: Date, agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE is_deleted = 0`;
    if (fromDate) { whereClause += ` AND invoice_date >= ?`; params.push(fromDate); }
    if (toDate) { whereClause += ` AND invoice_date <= ?`; params.push(toDate); }
    if (agencyId) { whereClause += ` AND agency_id = ?`; params.push(agencyId); }

    const result = await query(`
      SELECT
        COALESCE(SUM(CAST(sub_total AS NUMERIC)), 0) as taxable_amount,
        COALESCE(SUM(CAST(total_amount AS NUMERIC) - CAST(sub_total AS NUMERIC)), 0) as tax_amount,
        COALESCE(SUM(CAST(total_amount AS NUMERIC)), 0) as total_amount
      FROM invoices
      ${whereClause}
    `, params);

    return {
      taxableAmount: parseFloat(result.rows[0].taxable_amount) || 0,
      taxAmount: parseFloat(result.rows[0].tax_amount) || 0,
      totalAmount: parseFloat(result.rows[0].total_amount) || 0
    };
  }

  static async getGSTR1(month?: number, year?: number, agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE is_deleted = 0`;

    if (month && year) {
      whereClause += ` AND EXTRACT(MONTH FROM invoice_date) = ? AND EXTRACT(YEAR FROM invoice_date) = ?`;
      params.push(month, year);
    }
    if (agencyId) { whereClause += ` AND agency_id = ?`; params.push(agencyId); }

    // GSTR-1: Outward supplies (Sales)
    const result = await query(`
      SELECT
        c.gstin_number as receiver_gstin,
        CONCAT(c.fname, ' ', c.lname) as receiver_name,
        i.invoice_number,
        i.invoice_date,
        CAST(i.total_amount AS NUMERIC) as invoice_value,
        c.place_of_supply,
        'R' as reverse_charge,
        'Regular' as invoice_type,
        CAST(i.sub_total AS NUMERIC) as taxable_value,
        CAST(i.total_amount AS NUMERIC) - CAST(i.sub_total AS NUMERIC) as cess
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      ${whereClause}
      ORDER BY i.invoice_date
    `, params);

    return result;
  }

  static async getGSTR2(month?: number, year?: number, agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE p.is_deleted = 0`;

    if (month && year) {
      whereClause += ` AND EXTRACT(MONTH FROM p.purchase_date) = ? AND EXTRACT(YEAR FROM p.purchase_date) = ?`;
      params.push(month, year);
    }
    if (agencyId) { whereClause += ` AND p.agency_id = ?`; params.push(agencyId); }

    // GSTR-2: Inward supplies (Purchases)
    const result = await query(`
      SELECT
        v.gstin as supplier_gstin,
        COALESCE(v.cdisplay_name, v.company_name, CONCAT(v.fname, ' ', v.lname)) as supplier_name,
        p.purchase_number,
        p.purchase_date,
        CAST(p.total_amount AS NUMERIC) as invoice_value,
        CAST(p.sub_total AS NUMERIC) as taxable_value,
        CAST(p.total_amount AS NUMERIC) - CAST(p.sub_total AS NUMERIC) as tax_amount
      FROM purchase p
      JOIN vendors v ON p.customer_id = v.id
      ${whereClause}
      ORDER BY p.purchase_date
    `, params);

    return result;
  }

  static async getGSTR3B(month?: number, year?: number, agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE is_deleted = 0`;
    if (month && year) {
      whereClause += ` AND EXTRACT(MONTH FROM invoice_date) = ? AND EXTRACT(YEAR FROM invoice_date) = ?`;
      params.push(month, year);
    }
    if (agencyId) { whereClause += ` AND agency_id = ?`; params.push(agencyId); }

    // Purchase filter
    const pParams: any[] = [];
    let pWhere = `WHERE is_deleted = 0`;
    if (month && year) {
      pWhere += ` AND EXTRACT(MONTH FROM purchase_date) = ? AND EXTRACT(YEAR FROM purchase_date) = ?`;
      pParams.push(month, year);
    }
    if (agencyId) { pWhere += ` AND agency_id = ?`; pParams.push(agencyId); }

    // 3.1 Outward supplies
    const outwardResult = await query(`
      SELECT
        COALESCE(SUM(CAST(sub_total AS NUMERIC)), 0) as taxable_value,
        COALESCE(SUM(CAST(total_amount AS NUMERIC) - CAST(sub_total AS NUMERIC)), 0) as gst_amount
      FROM invoices
      ${whereClause}
    `, params);

    // 4. Eligible ITC (Purchases)
    const inwardResult = await query(`
      SELECT
        COALESCE(SUM(CAST(sub_total AS NUMERIC)), 0) as taxable_value,
        COALESCE(SUM(CAST(total_amount AS NUMERIC) - CAST(sub_total AS NUMERIC)), 0) as gst_amount
      FROM purchase
      ${pWhere}
    `, pParams);

    const outwardGST = parseFloat(outwardResult.rows[0].gst_amount) || 0;
    const inwardGST = parseFloat(inwardResult.rows[0].gst_amount) || 0;
    const netGST = outwardGST - inwardGST;

    return {
      rows: [{
        section: '3.1 Outward Supplies',
        taxable_value: parseFloat(outwardResult.rows[0].taxable_value) || 0,
        integrated_tax: 0,
        central_tax: outwardGST / 2,
        state_tax: outwardGST / 2,
        cess: 0
      }, {
        section: '4.1 Input Tax Credit',
        taxable_value: parseFloat(inwardResult.rows[0].taxable_value) || 0,
        integrated_tax: 0,
        central_tax: inwardGST / 2,
        state_tax: inwardGST / 2,
        cess: 0
      }, {
        section: '5.1 Net GST Liability',
        taxable_value: 0,
        integrated_tax: 0,
        central_tax: netGST / 2,
        state_tax: netGST / 2,
        cess: 0
      }]
    };
  }

  static async getTaxSummary(fromDate?: Date, toDate?: Date, agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE is_deleted = 0`;
    if (fromDate) { whereClause += ` AND invoice_date >= ?`; params.push(fromDate); }
    if (toDate) { whereClause += ` AND invoice_date <= ?`; params.push(toDate); }
    if (agencyId) { whereClause += ` AND agency_id = ?`; params.push(agencyId); }

    const result = await query(`
      SELECT
        TO_CHAR(invoice_date, 'YYYY-MM') as period,
        COUNT(*) as transaction_count,
        COALESCE(SUM(CAST(sub_total AS NUMERIC)), 0) as taxable_amount,
        COALESCE(SUM(CAST(total_amount AS NUMERIC) - CAST(sub_total AS NUMERIC)), 0) as tax_amount,
        COALESCE(SUM(CAST(total_amount AS NUMERIC)), 0) as total_amount
      FROM invoices
      ${whereClause}
      GROUP BY TO_CHAR(invoice_date, 'YYYY-MM')
      ORDER BY period DESC
    `, params);

    return result;
  }

  // Vendor Reports
  static async getVendorBalances(agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE 1=1`;
    if (agencyId) { whereClause += ` AND v.agency_id = ?`; params.push(agencyId); }
    const result = await query(`
      SELECT COALESCE(v.cdisplay_name, v.company_name, CONCAT(v.fname, ' ', v.lname)) as vendor_name,
             v.customer_email,
             v.cmobile_phone,
             COALESCE(SUM(CAST(p.total_amount AS NUMERIC)), 0) as total_purchases,
             COALESCE(SUM(CASE WHEN p.status != 'paid' THEN CAST(p.total_amount AS NUMERIC) ELSE 0 END), 0) as outstanding_balance
      FROM vendors v
      LEFT JOIN purchase p ON v.id = p.customer_id AND p.is_deleted = 0
      ${whereClause}
      GROUP BY v.id, v.customer_email, v.cmobile_phone
      ORDER BY outstanding_balance DESC
    `, params);

    return result;
  }

  static async getVendorCredits(agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE p.is_deleted = 0 AND p.status = 'paid'`;
    if (agencyId) { whereClause += ` AND p.agency_id = ?`; params.push(agencyId); }
    // Vendor credits - showing paid purchases
    const result = await query(`
      SELECT
        COALESCE(v.cdisplay_name, v.company_name, CONCAT(v.fname, ' ', v.lname)) as vendor_name,
        p.purchase_number,
        p.purchase_date,
        CAST(p.total_amount AS NUMERIC) as credit_amount,
        CASE p.status
          WHEN 'paid' THEN 'Paid'
          ELSE 'Pending'
        END as status
      FROM purchase p
      JOIN vendors v ON p.customer_id = v.id
      ${whereClause}
      ORDER BY p.purchase_date DESC
    `, params);

    return result;
  }

  static async getPurchaseByVendor(fromDate?: Date, toDate?: Date, agencyId?: number) {
    const params: any[] = [];
    let whereClause = `WHERE p.is_deleted = 0`;
    if (fromDate) { whereClause += ` AND p.purchase_date >= ?`; params.push(fromDate); }
    if (toDate) { whereClause += ` AND p.purchase_date <= ?`; params.push(toDate); }
    if (agencyId) { whereClause += ` AND p.agency_id = ?`; params.push(agencyId); }

    const result = await query(`
      SELECT COALESCE(v.cdisplay_name, v.company_name, CONCAT(v.fname, ' ', v.lname)) as vendor_name,
             v.customer_email,
             COUNT(p.id) as purchase_count,
             COALESCE(SUM(CAST(p.total_amount AS NUMERIC)), 0) as total_purchases,
             COALESCE(AVG(CAST(p.total_amount AS NUMERIC)), 0) as average_purchase
      FROM vendors v
      LEFT JOIN purchase p ON v.id = p.customer_id AND ${whereClause.replace('WHERE ', '')}
      GROUP BY v.id, v.customer_email
      HAVING COUNT(p.id) > 0
      ORDER BY total_purchases DESC
    `, params);

    return result;
  }

  static async getVendorPayments(fromDate?: Date, toDate?: Date, agencyId?: number) {
    // Vendor payments - showing purchases as proxy
    const params: any[] = [];
    let whereClause = `WHERE p.is_deleted = 0`;
    if (fromDate) { whereClause += ` AND p.purchase_date >= ?`; params.push(fromDate); }
    if (toDate) { whereClause += ` AND p.purchase_date <= ?`; params.push(toDate); }
    if (agencyId) { whereClause += ` AND p.agency_id = ?`; params.push(agencyId); }

    const result = await query(`
      SELECT p.purchase_date as payment_date,
             COALESCE(v.cdisplay_name, v.company_name, CONCAT(v.fname, ' ', v.lname)) as vendor_name,
             p.purchase_number,
             CAST(p.total_amount AS NUMERIC) as amount,
             CASE p.status
               WHEN 'draft' THEN 'Draft'
               WHEN 'pending' THEN 'Pending'
               WHEN 'paid' THEN 'Paid'
               ELSE p.status
             END as status
      FROM purchase p
      JOIN vendors v ON p.customer_id = v.id
      ${whereClause}
      ORDER BY p.purchase_date DESC
    `, params);

    return result;
  }
}





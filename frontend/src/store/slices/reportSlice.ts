import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { reportsAPI } from '../../services/api';

interface QuickStats {
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  outstanding: number;
  salesChange?: number;
  expensesChange?: number;
  profitChange?: number;
  outstandingChange?: number;
}

interface SalesReport {
  totalSales: number;
  totalInvoices: number;
  averageInvoiceValue: number;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalSales: number;
    invoiceCount: number;
  }>;
  salesByMonth: Array<{
    month: string;
    sales: number;
    invoices: number;
  }>;
}

interface ReceivablesReport {
  totalReceivables: number;
  overdueAmount: number;
  currentAmount: number;
  agingBuckets: Array<{
    range: string;
    amount: number;
    count: number;
  }>;
  topDebtors: Array<{
    customerId: string;
    customerName: string;
    amount: number;
    overdueAmount: number;
  }>;
}

interface ExpenseReport {
  totalExpenses: number;
  billableExpenses: number;
  nonBillableExpenses: number;
  expensesByCategory: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  expensesByMonth: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}

interface DashboardMetrics {
  totalCustomers: number;
  activeCustomers: number;
  totalItems: number;
  lowStockItems: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalSales: number;
  totalReceivables: number;
  totalExpenses: number;
  recentActivities: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

interface ReportState {
  quickStats: QuickStats;
  salesReport: SalesReport | null;
  receivablesReport: ReceivablesReport | null;
  expenseReport: ExpenseReport | null;
  dashboardMetrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
}

const initialState: ReportState = {
  quickStats: {
    totalSales: 0,
    totalExpenses: 0,
    netProfit: 0,
    outstanding: 0,
  },
  salesReport: null,
  receivablesReport: null,
  expenseReport: null,
  dashboardMetrics: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchQuickStats = createAsyncThunk(
  'reports/fetchQuickStats',
  async () => {
    const response = await reportsAPI.getDashboardMetrics();
    return response.data.metrics;
  }
);

export const fetchSalesReport = createAsyncThunk(
  'reports/fetchSalesReport',
  async (params?: { fromDate?: string; toDate?: string; customerId?: string }) => {
    const response = await reportsAPI.getSalesReport(params);
    return response.data.report;
  }
);

export const fetchReceivablesReport = createAsyncThunk(
  'reports/fetchReceivablesReport',
  async () => {
    const response = await reportsAPI.getReceivablesReport();
    return response.data.report;
  }
);

export const fetchExpenseReport = createAsyncThunk(
  'reports/fetchExpenseReport',
  async (params?: { fromDate?: string; toDate?: string; category?: string }) => {
    const response = await reportsAPI.getExpenseReport(params);
    return response.data.report;
  }
);

export const fetchDashboardMetrics = createAsyncThunk(
  'reports/fetchDashboardMetrics',
  async () => {
    const response = await reportsAPI.getDashboardMetrics();
    return response.data.metrics;
  }
);

const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearReports: (state) => {
      state.salesReport = null;
      state.receivablesReport = null;
      state.expenseReport = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Quick Stats
    builder
      .addCase(fetchQuickStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuickStats.fulfilled, (state, action: PayloadAction<DashboardMetrics>) => {
        state.loading = false;
        state.quickStats = {
          totalSales: action.payload.totalSales,
          totalExpenses: action.payload.totalExpenses,
          netProfit: action.payload.totalSales - action.payload.totalExpenses,
          outstanding: action.payload.totalReceivables,
        };
      })
      .addCase(fetchQuickStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch quick stats';
      });

    // Sales Report
    builder
      .addCase(fetchSalesReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesReport.fulfilled, (state, action: PayloadAction<SalesReport>) => {
        state.loading = false;
        state.salesReport = action.payload;
      })
      .addCase(fetchSalesReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch sales report';
      });

    // Receivables Report
    builder
      .addCase(fetchReceivablesReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReceivablesReport.fulfilled, (state, action: PayloadAction<ReceivablesReport>) => {
        state.loading = false;
        state.receivablesReport = action.payload;
      })
      .addCase(fetchReceivablesReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch receivables report';
      });

    // Expense Report
    builder
      .addCase(fetchExpenseReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenseReport.fulfilled, (state, action: PayloadAction<ExpenseReport>) => {
        state.loading = false;
        state.expenseReport = action.payload;
      })
      .addCase(fetchExpenseReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch expense report';
      });

    // Dashboard Metrics
    builder
      .addCase(fetchDashboardMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardMetrics.fulfilled, (state, action: PayloadAction<DashboardMetrics>) => {
        state.loading = false;
        state.dashboardMetrics = action.payload;
      })
      .addCase(fetchDashboardMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch dashboard metrics';
      });
  },
});

export const { clearReports } = reportSlice.actions;
export default reportSlice.reducer;

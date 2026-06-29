import { Platform } from 'react-native';

// API Configuration
// Web: auto-detect hostname from browser so the same build works on both
//   localhost (dev) and any server IP/domain (production) without code changes.
// Mobile: use EXPO_PUBLIC_API_URL env var; falls back to localhost for emulator.
const getBaseServerUrl = (): string => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:8001`;
  }
  // Mobile (Android physical device, iOS) — set EXPO_PUBLIC_API_URL to your machine/server IP
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001';
};

const BASE_SERVER_URL = getBaseServerUrl();
const API_BASE_URL = `${BASE_SERVER_URL}/api/v1`;

export { BASE_SERVER_URL };

// Helper function to get auth token (persisted in localStorage for web)
const TOKEN_KEY = 'erp_auth_token';
let authToken: string | null = (() => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  } catch {
    return null;
  }
})();

export const setAuthToken = (token: string | null) => {
  authToken = token;
  try {
    if (typeof localStorage !== 'undefined') {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
};

export const getAuthToken = () => authToken;

// Helper function for API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = {};

  // Only add Content-Type if it's not FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add existing headers
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers[key] = value;
      }
    });
  }

  // Add auth token if available
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      cache: 'no-store', // Disable fetch cache
    });

  } catch (fetchError) {
    console.error('❌ Fetch Error:', {
      endpoint,
      error: fetchError,
      message: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
    });
    throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect to server'}`);
  }

  if (!response.ok) {
    if (response.status === 401) {
      setAuthToken(null);
    }
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// Auth API
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: number | string;
    email: string;
    username: string;
    role: string;
    agencyId?: number; // Add optional agencyId from backend
  };
  token: string;
  refreshToken: string;
}

export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store token for subsequent requests
    if (response.token) {
      setAuthToken(response.token);
    }

    return response;
  },
  getMe: async () => {
    return apiCall('/auth/me');
  },
  sendOtp: () => apiCall('/auth/send-otp', { method: 'POST' }),
  verifyOtp: (otp: string) => apiCall('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ otp }) }),
};

// Public API (No authentication required)
export const publicAPI = {
  registerAgency: async (data: any) => {
    return apiCall('/public/register-agency', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  verifyRegistrationOtp: async (userId: string | number, otp: string) => {
    const response = await apiCall('/public/verify-registration-otp', {
      method: 'POST',
      body: JSON.stringify({ userId, otp }),
    });

    // Auto-login on successful verification
    if (response.data?.token) {
      setAuthToken(response.data.token);
    }

    return response;
  },
  resendRegistrationOtp: async (userId: string | number) => {
    return apiCall('/public/resend-registration-otp', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },
};

// Subscription API
export const subscriptionAPI = {
  // Get all available plans (public)
  getPlans: async () => {
    return apiCall('/subscriptions/plans');
  },

  // Get current subscription
  getCurrent: async () => {
    return apiCall('/subscriptions/current');
  },

  // Get usage statistics
  getUsage: async () => {
    return apiCall('/subscriptions/usage');
  },

  // Create payment intent for plan upgrade
  createPaymentIntent: async (planId: number) => {
    return apiCall('/subscriptions/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  },

  // Confirm upgrade after payment
  confirmUpgrade: async (planId: number, paymentIntentId: string) => {
    return apiCall('/subscriptions/confirm-upgrade', {
      method: 'POST',
      body: JSON.stringify({ planId, paymentIntentId }),
    });
  },

  // Cancel subscription
  cancel: async (immediately: boolean = false) => {
    return apiCall('/subscriptions/cancel', {
      method: 'POST',
      body: JSON.stringify({ immediately }),
    });
  },

  // Get payment history
  getPaymentHistory: async () => {
    return apiCall('/subscriptions/payment-history');
  },
};

// Users API
export const usersAPI = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    return apiCall(`/users?${queryParams.toString()}`);
  },

  getById: async (id: string) => {
    return apiCall(`/users/${id}`);
  },

  create: async (data: any) => {
    return apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiCall(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// Customers API
export const customersAPI = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    return apiCall(`/customers?${queryParams.toString()}`);
  },

  getById: async (id: string) => {
    return apiCall(`/customers/${id}`);
  },

  create: async (data: any) => {
    return apiCall('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiCall(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiCall(`/customers/${id}`, {
      method: 'DELETE',
    });
  },
};

// Items/Inventory API
export const itemsAPI = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    return apiCall(`/items?${queryParams.toString()}`);
  },

  getById: async (id: string) => {
    return apiCall(`/items/${id}`);
  },

  create: async (data: any) => {
    return apiCall('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiCall(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiCall(`/items/${id}`, {
      method: 'DELETE',
    });
  },
};

// Vendors API
export const vendorsAPI = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    return apiCall(`/vendors?${queryParams.toString()}`);
  },

  getById: async (id: string) => {
    return apiCall(`/vendors/${id}`);
  },

  create: async (data: any) => {
    return apiCall('/vendors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiCall(`/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiCall(`/vendors/${id}`, {
      method: 'DELETE',
    });
  },
};

// Invoices API
export const invoicesAPI = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; status?: string; type?: string; customerId?: string; customer_id?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.customerId) queryParams.append('customerId', params.customerId);
    if (params?.customer_id) queryParams.append('customerId', params.customer_id);

    return apiCall(`/invoices?${queryParams.toString()}`);
  },

  getById: async (id: string) => {
    return apiCall(`/invoices/${id}`);
  },

  create: async (data: any) => {
    return apiCall('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiCall(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiCall(`/invoices/${id}`, {
      method: 'DELETE',
    });
  },

  emailInvoice: async (id: string, data: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject?: string;
    message?: string;
  }) => {
    return apiCall(`/invoices/${id}/email`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  downloadPDF: async (id: string): Promise<Blob> => {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/invoices/${id}/pdf`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }

    return response.blob();
  },
};

// Purchases API
export const purchasesAPI = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);

    return apiCall(`/purchases?${queryParams.toString()}`);
  },

  getById: async (id: string) => {
    return apiCall(`/purchases/${id}`);
  },

  create: async (data: any) => {
    return apiCall('/purchases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiCall(`/purchases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiCall(`/purchases/${id}`, {
      method: 'DELETE',
    });
  },

  emailPurchase: async (id: string, data: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject?: string;
    message?: string;
  }) => {
    return apiCall(`/purchases/${id}/email`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  downloadPDF: async (id: string): Promise<Blob> => {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/purchases/${id}/pdf`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }

    return response.blob();
  },
};

// Payments API
export const paymentsAPI = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    return apiCall(`/payments?${queryParams.toString()}`);
  },

  getById: async (id: string) => {
    return apiCall(`/payments/${id}`);
  },

  create: async (data: any) => {
    return apiCall('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiCall(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiCall(`/payments/${id}`, {
      method: 'DELETE',
    });
  },
};

// Expenses API
export const expensesAPI = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    return apiCall(`/expenses?${queryParams.toString()}`);
  },

  getById: async (id: string) => {
    return apiCall(`/expenses/${id}`);
  },

  create: async (data: any) => {
    return apiCall('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiCall(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiCall(`/expenses/${id}`, {
      method: 'DELETE',
    });
  },

  emailExpense: async (id: string, data: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject?: string;
    message?: string;
  }) => {
    return apiCall(`/expenses/${id}/email`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  downloadPDF: async (id: string): Promise<Blob> => {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/expenses/${id}/pdf`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }

    return response.blob();
  },
};

// Reports API
export const reportsAPI = {
  // Dashboard
  getDashboardMetrics: async () => {
    return apiCall('/reports/dashboard');
  },

  // Sales Reports
  getSalesReport: async (params?: { fromDate?: string; toDate?: string; customerId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    if (params?.customerId) queryParams.append('customerId', params.customerId);
    return apiCall(`/reports/sales?${queryParams.toString()}`);
  },

  getSalesByCustomer: async (params?: { fromDate?: string; toDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    return apiCall(`/reports/sales-by-customer?${queryParams.toString()}`);
  },

  getSalesByItem: async (params?: { fromDate?: string; toDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    return apiCall(`/reports/sales-by-item?${queryParams.toString()}`);
  },

  getSalesBySalesperson: async (params?: { fromDate?: string; toDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    return apiCall(`/reports/sales-by-salesperson?${queryParams.toString()}`);
  },

  // Receivables Reports
  getReceivablesReport: async () => {
    return apiCall('/reports/receivables');
  },

  getCustomerBalances: async () => {
    return apiCall('/reports/customer-balances');
  },

  getAgingSummary: async () => {
    return apiCall('/reports/aging-summary');
  },

  getAgingDetails: async () => {
    return apiCall('/reports/aging-details');
  },

  getInvoiceDetails: async (params?: { fromDate?: string; toDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    return apiCall(`/reports/invoice-details?${queryParams.toString()}`);
  },

  // Payments Received Reports
  getPaymentsReceived: async (params?: { fromDate?: string; toDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    return apiCall(`/reports/payments-received?${queryParams.toString()}`);
  },

  getWithholdingTax: async (params?: { fromDate?: string; toDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    return apiCall(`/reports/withholding-tax?${queryParams.toString()}`);
  },

  // Expenses Reports
  getExpenseReport: async (params?: { fromDate?: string; toDate?: string; category?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    if (params?.category) queryParams.append('category', params.category);
    return apiCall(`/reports/expenses?${queryParams.toString()}`);
  },

  getExpenseDetails: async (params?: { fromDate?: string; toDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    return apiCall(`/reports/expense-details?${queryParams.toString()}`);
  },

  getExpensesByCategory: async (params?: { fromDate?: string; toDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    return apiCall(`/reports/expenses-by-category?${queryParams.toString()}`);
  },

  getExpensesByCustomer: async (params?: { fromDate?: string; toDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    return apiCall(`/reports/expenses-by-customer?${queryParams.toString()}`);
  },

  // Inventory Reports
  getInventorySummary: async () => {
    return apiCall('/reports/inventory-summary');
  },

  getInventoryValuation: async () => {
    return apiCall('/reports/inventory-valuation');
  },

  getStockSummary: async () => {
    return apiCall('/reports/stock-summary');
  },

  getProductSales: async (params?: { fromDate?: string; toDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    return apiCall(`/reports/product-sales?${queryParams.toString()}`);
  },

  // Financial Reports
  getProfitLoss: async (params?: { fromDate?: string; toDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    return apiCall(`/reports/profit-loss?${queryParams.toString()}`);
  },

  getBalanceSheet: async (params?: { asOfDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.asOfDate) queryParams.append('asOfDate', params.asOfDate);
    return apiCall(`/reports/balance-sheet?${queryParams.toString()}`);
  },

  getCashFlow: async (params?: { fromDate?: string; toDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    return apiCall(`/reports/cash-flow?${queryParams.toString()}`);
  },

  getTrialBalance: async (params?: { asOfDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.asOfDate) queryParams.append('asOfDate', params.asOfDate);
    return apiCall(`/reports/trial-balance?${queryParams.toString()}`);
  },

  // Tax Reports
  getGSTSummary: async (params?: { fromDate?: string; toDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    return apiCall(`/reports/gst-summary?${queryParams.toString()}`);
  },

  getGSTR1: async (params?: { month?: string; year?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.month) queryParams.append('month', params.month);
    if (params?.year) queryParams.append('year', params.year);
    return apiCall(`/reports/gstr1?${queryParams.toString()}`);
  },

  getGSTR2: async (params?: { month?: string; year?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.month) queryParams.append('month', params.month);
    if (params?.year) queryParams.append('year', params.year);
    return apiCall(`/reports/gstr2?${queryParams.toString()}`);
  },

  getGSTR3B: async (params?: { month?: string; year?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.month) queryParams.append('month', params.month);
    if (params?.year) queryParams.append('year', params.year);
    return apiCall(`/reports/gstr3b?${queryParams.toString()}`);
  },

  getTaxSummary: async (params?: { fromDate?: string; toDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    return apiCall(`/reports/tax-summary?${queryParams.toString()}`);
  },

  // Vendor Reports
  getVendorBalances: async () => {
    return apiCall('/reports/vendor-balances');
  },

  getVendorCredits: async () => {
    return apiCall('/reports/vendor-credits');
  },

  getPurchaseByVendor: async (params?: { fromDate?: string; toDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    return apiCall(`/reports/purchase-by-vendor?${queryParams.toString()}`);
  },

  getVendorPayments: async (params?: { fromDate?: string; toDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    return apiCall(`/reports/vendor-payments?${queryParams.toString()}`);
  },
};

// Agencies API
export const agenciesAPI = {
  getAll: async () => {
    return apiCall('/agencies');
  },

  getById: async (id: number) => {
    return apiCall(`/agencies/${id}`);
  },

  create: async (data: {
    companyName: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    gstNumber?: string;
    panNumber?: string;
    logoUrl?: string;
    subscriptionPlan?: string;
    userName?: string;
  }) => {
    return apiCall('/agencies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: any) => {
    return apiCall(`/agencies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (id: number, status: 'active' | 'inactive' | 'suspended') => {
    return apiCall(`/agencies/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  delete: async (id: number) => {
    return apiCall(`/agencies/${id}`, {
      method: 'DELETE',
    });
  },

  getSettings: async (id: number) => {
    return apiCall(`/agencies/${id}/settings`);
  },

  updateSettings: async (id: number, settings: Record<string, any>) => {
    return apiCall(`/agencies/${id}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  getBusinessTypes: async (): Promise<string[]> => {
    const res = await apiCall('/agencies/config/business-types');
    return res?.data || [];
  },

  updateBusinessTypes: async (businessTypes: string[]) => {
    return apiCall('/agencies/config/business-types', {
      method: 'PUT',
      body: JSON.stringify({ businessTypes }),
    });
  },
};

// Email Preview API
export const emailPreviewAPI = {
  preview: (params: { type?: string; invoiceNumber?: string; customerName?: string; amount?: string }) =>
    apiCall(
      `/email/preview?type=${encodeURIComponent(params.type || 'invoice')}&invoiceNumber=${encodeURIComponent(params.invoiceNumber || '')}&customerName=${encodeURIComponent(params.customerName || '')}&amount=${encodeURIComponent(params.amount || '0.00')}`
    ),
};

// Email API
export const emailAPI = {
  sendInvoice: async (data: {
    recipientEmail: string;
    recipientName: string;
    invoiceNumber: string;
    invoiceAmount: number;
  }) => {
    return apiCall('/email/send-invoice', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  sendPurchaseOrder: async (data: {
    recipientEmail: string;
    recipientName: string;
    poNumber: string;
    poAmount: number;
  }) => {
    return apiCall('/email/send-purchase-order', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  sendPaymentReceipt: async (data: {
    recipientEmail: string;
    recipientName: string;
    receiptNumber: string;
    paymentAmount: number;
    paymentDate: string;
  }) => {
    return apiCall('/email/send-payment-receipt', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  testConnection: async () => {
    return apiCall('/email/test');
  },
};

// Helper function for blob downloads
const downloadBlob = async (endpoint: string, options: RequestInit = {}): Promise<Blob> => {
  const headers: Record<string, string> = {};

  // Add existing headers
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers[key] = value;
      }
    });
  }

  // Add auth token if available
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    mode: 'cors',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Download failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.blob();
};

// Unified API object for convenience
export const api = {
  get: (endpoint: string, options?: { responseType?: 'json' | 'blob' }) => {
    if (options?.responseType === 'blob') {
      return downloadBlob(endpoint);
    }
    return apiCall(endpoint).then(json => ({ data: json }));
  },
  post: (endpoint: string, data?: any) => apiCall(endpoint, {
    method: 'POST',
    body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
  }).then(json => ({ data: json })),
  put: (endpoint: string, data?: any) => apiCall(endpoint, {
    method: 'PUT',
    body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
  }).then(json => ({ data: json })),
  patch: (endpoint: string, data?: any) => apiCall(endpoint, {
    method: 'PATCH',
    body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
  }).then(json => ({ data: json })),
  delete: (endpoint: string) => apiCall(endpoint, {
    method: 'DELETE',
  }).then(json => ({ data: json })),

  // Email API
  email: {
    preview: (params: { type?: string; invoiceNumber?: string; customerName?: string; amount?: string }) =>
      apiCall(
        `/email/preview?type=${encodeURIComponent(params.type || 'invoice')}&invoiceNumber=${encodeURIComponent(params.invoiceNumber || '')}&customerName=${encodeURIComponent(params.customerName || '')}&amount=${encodeURIComponent(params.amount || '0.00')}`
      ),
  },

  // Gate Pass API
  gatePasses: {
    getAll: (params?: { page?: number; limit?: number; search?: string; type?: 'inward' | 'outward' }) => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.type) queryParams.append('type', params.type);
      return apiCall(`/gate-passes?${queryParams.toString()}`);
    },
    getById: (id: string) => apiCall(`/gate-passes/${id}`),
    create: (data: any) => apiCall('/gate-passes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiCall(`/gate-passes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => apiCall(`/gate-passes/${id}`, {
      method: 'DELETE',
    }),
  },

  // Purchase Orders API
  purchaseOrders: {
    getAll: (params?: { page?: number; limit?: number; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.append('page', params.page.toString());
      if (params?.limit) q.append('limit', params.limit.toString());
      if (params?.search) q.append('search', params.search);
      return apiCall(`/purchase-orders?${q.toString()}`);
    },
    getById: (id: string) => apiCall(`/purchase-orders/${id}`),
    create: (data: any) => apiCall('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiCall(`/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiCall(`/purchase-orders/${id}`, { method: 'DELETE' }),
  },

  // Production Orders API
  productionOrders: {
    getAll: (params?: { page?: number; limit?: number; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.append('page', params.page.toString());
      if (params?.limit) q.append('limit', params.limit.toString());
      if (params?.search) q.append('search', params.search);
      return apiCall(`/production-orders?${q.toString()}`);
    },
    getById: (id: string) => apiCall(`/production-orders/${id}`),
    create: (data: any) => apiCall('/production-orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiCall(`/production-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiCall(`/production-orders/${id}`, { method: 'DELETE' }),
  },

  // Bill of Materials API
  billOfMaterials: {
    getAll: (params?: { page?: number; limit?: number; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.append('page', params.page.toString());
      if (params?.limit) q.append('limit', params.limit.toString());
      if (params?.search) q.append('search', params.search);
      return apiCall(`/bill-of-materials?${q.toString()}`);
    },
    getById: (id: string) => apiCall(`/bill-of-materials/${id}`),
    create: (data: any) => apiCall('/bill-of-materials', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiCall(`/bill-of-materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiCall(`/bill-of-materials/${id}`, { method: 'DELETE' }),
  },

  // Recurring Invoices API
  recurringInvoices: {
    getAll: (params?: { page?: number; limit?: number; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.append('page', params.page.toString());
      if (params?.limit) q.append('limit', params.limit.toString());
      if (params?.search) q.append('search', params.search);
      return apiCall(`/recurring-invoices?${q.toString()}`);
    },
    getById: (id: string) => apiCall(`/recurring-invoices/${id}`),
    create: (data: any) => apiCall('/recurring-invoices', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiCall(`/recurring-invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiCall(`/recurring-invoices/${id}`, { method: 'DELETE' }),
  },

  // Time Tracking API
  timeTracking: {
    getAll: (params?: { page?: number; limit?: number; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.append('page', params.page.toString());
      if (params?.limit) q.append('limit', params.limit.toString());
      if (params?.search) q.append('search', params.search);
      return apiCall(`/time-tracking?${q.toString()}`);
    },
    getById: (id: string) => apiCall(`/time-tracking/${id}`),
    create: (data: any) => apiCall('/time-tracking', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiCall(`/time-tracking/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiCall(`/time-tracking/${id}`, { method: 'DELETE' }),
  },

  // Projects API
  projects: {
    getAll: (params?: { page?: number; limit?: number; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.append('page', params.page.toString());
      if (params?.limit) q.append('limit', params.limit.toString());
      if (params?.search) q.append('search', params.search);
      return apiCall(`/projects?${q.toString()}`);
    },
    getById: (id: string) => apiCall(`/projects/${id}`),
    create: (data: any) => apiCall('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiCall(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiCall(`/projects/${id}`, { method: 'DELETE' }),
  },

  // Trip Sheets API
  tripSheets: {
    getAll: (params?: { page?: number; limit?: number; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.append('page', params.page.toString());
      if (params?.limit) q.append('limit', params.limit.toString());
      if (params?.search) q.append('search', params.search);
      return apiCall(`/trip-sheets?${q.toString()}`);
    },
    getById: (id: string) => apiCall(`/trip-sheets/${id}`),
    create: (data: any) => apiCall('/trip-sheets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiCall(`/trip-sheets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiCall(`/trip-sheets/${id}`, { method: 'DELETE' }),
  },

  // Fleet API
  fleet: {
    getAll: (params?: { page?: number; limit?: number; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.append('page', params.page.toString());
      if (params?.limit) q.append('limit', params.limit.toString());
      if (params?.search) q.append('search', params.search);
      return apiCall(`/fleet?${q.toString()}`);
    },
    getById: (id: string) => apiCall(`/fleet/${id}`),
    create: (data: any) => apiCall('/fleet', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiCall(`/fleet/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiCall(`/fleet/${id}`, { method: 'DELETE' }),
  },

  // Batch Tracking API
  batchTracking: {
    getAll: (params?: { page?: number; limit?: number; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.append('page', params.page.toString());
      if (params?.limit) q.append('limit', params.limit.toString());
      if (params?.search) q.append('search', params.search);
      return apiCall(`/batch-tracking?${q.toString()}`);
    },
    getById: (id: string) => apiCall(`/batch-tracking/${id}`),
    create: (data: any) => apiCall('/batch-tracking', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiCall(`/batch-tracking/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiCall(`/batch-tracking/${id}`, { method: 'DELETE' }),
  },

  // Customs / Shipping API
  customs: {
    getAll: (params?: { page?: number; limit?: number; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.append('page', params.page.toString());
      if (params?.limit) q.append('limit', params.limit.toString());
      if (params?.search) q.append('search', params.search);
      return apiCall(`/customs?${q.toString()}`);
    },
    getById: (id: string) => apiCall(`/customs/${id}`),
    create: (data: any) => apiCall('/customs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiCall(`/customs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiCall(`/customs/${id}`, { method: 'DELETE' }),
  },

  // POS / Counter Sale API
  pos: {
    getAll: (params?: { page?: number; limit?: number; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.append('page', params.page.toString());
      if (params?.limit) q.append('limit', params.limit.toString());
      if (params?.search) q.append('search', params.search);
      return apiCall(`/pos?${q.toString()}`);
    },
    getById: (id: string) => apiCall(`/pos/${id}`),
    create: (data: any) => apiCall('/pos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiCall(`/pos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiCall(`/pos/${id}`, { method: 'DELETE' }),
  },
};

export default API_BASE_URL;

// TypeScript type definitions for the ERP Business Management System (MySQL/mawebtec_lms)

export interface User {
  id: number;
  email: string;
  username: string;
  mobile?: string;
  role: string;
  is_active: number;
  created_date?: Date;
  updated_date?: Date;
}

export interface Agency {
  id: number;
  company_name: string;
  database_name?: string;
  logo?: string;
  address?: string;
  gstin_number?: string;
  pan_number?: string;
  phone_number?: string;
  bank_name?: string;
  bank_branch?: string;
  account_number?: string;
  account_type?: string;
  ifsc_code?: string;
  created_by?: number;
  created_date?: Date;
  updated_by?: number;  // was update_by (typo fixed)
  updated_date?: Date;
}

export interface Customer {
  id: number;
  customertype_id: number;
  salutation_id: number;
  fname: string;
  lname: string;
  company_name: string;
  cdisplay_name: string;
  customer_email: string;
  cwork_phone?: string;
  cmobile_phone?: string;
  skype_name?: string;
  designation?: string;
  department?: string;
  website?: string;
  gst_treatment: number;
  gstin_number?: string;
  place_of_supply?: number;
  taxpreferences?: number;
  currency_id: number;
  payment_terms?: number;
  enable_portal: number;
  remark?: string;
  is_active: number;
  agency_id: number;
  created_by: number;
  created_date: Date;
  updated_by: number;
  updated_date: Date;
}

export interface CustomerAddress {
  id: number;
  customer_id: number;
  attention?: string;
  country_id?: number;
  address?: string;
  city?: string;
  state_id?: number;
  zip_code?: string;
  phone?: string;
  fax?: string;
  address_type: string;
}

export interface CustomerContact {
  id: number;
  customer_id: number;
  salutation_id?: number;
  fname?: string;
  lname?: string;
  email?: string;
  work_phone?: string;
  mobile?: string;
  skype_name?: string;
  designation?: string;
  department?: string;
}

export interface Item {
  id: number;
  item_code: string;
  item_name: string;
  item_type?: string;    // was itemtype_id (number) — now VARCHAR
  unit?: string;         // was item_unit (number) — now VARCHAR
  description?: string;  // was item_description
  selling_price: number; // was item_rate (split into two)
  purchase_price: number;
  tax_rate?: number;     // was item_tax
  hsn_code?: string;
  sac_code?: string;
  opening_stock?: number;
  opening_stock_rate?: number;
  reorder_point?: number;
  is_active: number;
  created_by: number;
  created_date: Date;
  updated_by: number;
  updated_date: Date;
}

export interface Vendor {
  id: number;
  vendor_name: string;    // was vdisplay_name / fname+lname
  vendor_email?: string;
  vendor_phone?: string;  // was vwork_phone
  vendor_mobile?: string; // was vmobile_phone
  company_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  gstin_number?: string;
  pan_number?: string;
  website?: string;
  bank_name?: string;
  bank_branch?: string;
  account_number?: string;
  account_type?: string;
  ifsc_code?: string;
  remark?: string;
  is_active: number;
  created_by: number;
  created_date: Date;
  updated_by?: number;
  updated_date: Date;
}

export interface VendorAddress {
  id: number;
  vendor_id: number;
  attention?: string;
  country_id?: number;
  address?: string;
  city?: string;
  state_id?: number;
  zip_code?: string;
  phone?: string;
  fax?: string;
  address_type: string;
}

export interface VendorContact {
  id: number;
  vendor_id: number;
  salutation_id?: number;
  fname?: string;
  lname?: string;
  email?: string;
  work_phone?: string;
  mobile?: string;
  skype_name?: string;
  designation?: string;
  department?: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer?: Customer;
  invoice_date: Date;
  due_date?: Date;
  payment_terms?: string;
  type: string;          // was invoice_type (number)
  status: string;        // was invoice_status (number) — now VARCHAR ('draft','sent','paid','overdue','cancelled')
  subject?: string;
  subtotal: number;      // was sub_total
  discount_amount?: number; // was discount / adjustment
  tax_amount?: number;
  total_amount: number;  // was total
  paid_amount?: number;
  balance_amount?: number;
  customer_notes?: string;
  terms_conditions?: string;
  is_deleted?: number;
  created_by: number;
  created_date: Date;
  updated_by: number;
  updated_date: Date;
  lineItems?: InvoiceDetail[];
}

export interface InvoiceDetail {
  id: number;
  invoice_id: number;
  item_id?: number;
  item?: Item;
  item_name: string;
  description?: string;  // was item_description
  quantity: number;      // was item_qty
  unit?: string;
  rate: number;          // was item_rate
  discount_percent?: number; // was item_discount
  tax_rate?: number;     // was item_tax
  amount: number;        // was item_amount
}

export interface Purchase {
  id: number;
  purchase_number: string;  // was purchase_order_number
  vendor_id: number;
  vendor?: Vendor;
  purchase_date: Date;
  due_date?: Date;           // was expected_delivery_date
  payment_terms?: string;
  reference_number?: string;
  subtotal: number;          // was sub_total
  discount_amount?: number;
  tax_amount?: number;
  total_amount: number;      // was total
  paid_amount?: number;
  balance_amount?: number;
  status: string;
  vendor_notes?: string;
  terms_conditions?: string;
  is_deleted?: number;
  created_by: number;
  created_date: Date;
  updated_by?: number;
  updated_date: Date;
  lineItems?: PurchaseDetail[];
}

export interface PurchaseDetail {
  id: number;
  purchase_id: number;
  item_id?: number;
  item?: Item;
  item_name: string;
  description?: string;
  quantity: number;      // was item_qty
  unit?: string;
  rate: number;          // was item_rate
  discount_percent?: number; // was item_discount
  tax_rate?: number;     // was item_tax
  amount: number;        // was item_amount
}

export interface Payment {
  id: number;
  payment_number?: string;
  customer_id: number;
  customer?: Customer;
  payment_date: Date;
  payment_mode: string;  // was number — now VARCHAR ('cash','cheque','neft','upi','card')
  amount: number;        // was amount_received
  bank_charges?: number;
  reference_number?: string;
  notes?: string;
  created_by: number;
  created_date: Date;
  updated_by?: number;
  updated_date: Date;
  allocations?: InvoicePayment[];
}

export interface InvoicePayment {
  id: number;
  invoice_id: number;
  payment_id: number;
  invoice?: Invoice;
  amount: number;
  created_date: Date;
}

export interface Expense {
  id: number;
  expense_account: number;
  amount: number;
  expense_date: Date;
  expense_status: number;
  vendor_id?: number;
  vendor?: Vendor;
  customer_id?: number;
  customer?: Customer;
  notes?: string;
  is_billable: number;
  invoice_id?: number;
  agency_id: number;
  created_by: number;
  created_date: Date;
  updated_by: number;
  updated_date: Date;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
}

export interface ItemConsume {
  id: number;
  item_id: number;
  item?: Item;
  consume_qty: number;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
  created_date: Date;
}

export interface State {
  id: number;
  name: string;
  state_code: string;
}

export interface Salutation {
  id: number;
  name: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
}

export interface PaymentTerm {
  id: number;
  name: string;
  days: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Request types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CustomerQuery extends PaginationQuery {
  active?: boolean;
}

export interface ItemQuery extends PaginationQuery {
  active?: boolean;
  category?: string;
}

export interface InvoiceQuery extends PaginationQuery {
  customerId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export interface PaymentQuery extends PaginationQuery {
  customerId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ExpenseQuery extends PaginationQuery {
  category?: string;
  fromDate?: string;
  toDate?: string;
  billable?: boolean;
}

// Report types
export interface SalesReport {
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

export interface ReceivablesReport {
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

export interface ExpenseReport {
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

export interface DashboardMetrics {
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
    timestamp: Date;
  }>;
}
export
 interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  changes?: any;
  ip_address?: string;
  user_agent?: string;
  created_date?: Date;
}

export interface StockMovement {
  id: number;
  item_id: number;
  movement_type: string;
  quantity: number;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
  created_by?: number;
  created_date?: Date;
}

import React from 'react';

// Core entity types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'agency' | 'user';
  agencyId?: number;
  accountType?: 'agency' | 'user';
  permissions: string[];
  isActive: boolean;
  isTrial?: boolean;
  trialEndsAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address: Address;
  gstin?: string;
  creditLimit?: number;
  paymentTerms: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced customer interface with comprehensive management features
export interface EnhancedCustomer extends Omit<Customer, 'address'> {
  customerType: 'business' | 'individual';
  displayName?: string;
  gstTreatment: 'registered_business_regular' | 'unregistered' | 'consumer' | 'tax_exempt';
  taxPreference: 'taxable' | 'tax_exempt';
  currency: string;
  placeOfSupply?: string;
  enablePortal: boolean;
  billingAddress: DetailedAddress;
  shippingAddress: DetailedAddress;
  contactPersons: ContactPerson[];
  remarks?: string;
  website?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Enhanced address interface for detailed address management
export interface DetailedAddress extends Address {
  attention?: string;
  phone?: string;
  fax?: string;
}

// Contact person interface for customer management
export interface ContactPerson {
  id: string;
  salutation: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  workPhone?: string;
  mobile?: string;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  description?: string;
  hsnCode?: string;
  unitPrice: number;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced item interface with goods/services classification and tax handling
export interface EnhancedItem extends Item {
  itemType: 'goods' | 'service';
  taxPreference: 'taxable' | 'tax_exempt';
  intraStateTaxRate: number;
  interStateTaxRate: number;
  sellingPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer?: Customer;
  issueDate: Date;
  dueDate: Date;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItem {
  id: string;
  itemId: string;
  item?: Item;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  customerId: string;
  customer?: Customer;
  amount: number;
  paymentDate: Date;
  paymentMode: 'cash' | 'cheque' | 'neft' | 'upi' | 'card';
  referenceNumber?: string;
  invoiceAllocations: PaymentAllocation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentAllocation {
  invoiceId: string;
  amount: number;
}

export interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address: Address;
  gstin?: string;
  bankDetails?: BankDetails;
  paymentTerms: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankDetails {
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  accountHolderName: string;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  vendorId: string;
  vendor?: Vendor;
  purchaseDate: Date;
  lineItems: PurchaseLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: 'pending' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseLineItem {
  id: string;
  itemId: string;
  item?: Item;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  expenseDate: Date;
  customerId?: string;
  customer?: Customer;
  receiptUrl?: string;
  isBillable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Form and UI component interfaces
export interface FormErrors {
  [field: string]: string | string[];
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  entriesPerPage: number;
}

export interface TabDefinition {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export interface DropdownOption {
  label: string;
  value: string;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

// API request/response interfaces
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationState;
}

export interface CustomerListParams {
  page: number;
  limit: number;
  search?: string;
  customerType?: 'business' | 'individual';
  isActive?: boolean;
}

export interface ItemListParams {
  page: number;
  limit: number;
  search?: string;
  itemType?: 'goods' | 'service';
  isActive?: boolean;
}

export interface CreateCustomerRequest extends Omit<EnhancedCustomer, 'id' | 'createdAt' | 'updatedAt'> { }

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> { }

export interface CreateItemRequest extends Omit<EnhancedItem, 'id' | 'createdAt' | 'updatedAt'> { }

export interface UpdateItemRequest extends Partial<CreateItemRequest> { }

export interface CustomerAddressRequest {
  addressType: 'billing' | 'shipping';
  attention?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  fax?: string;
}

export interface ContactPersonRequest extends Omit<ContactPerson, 'id'> { }

// Component prop interfaces
export interface TabbedFormProps {
  tabs: TabDefinition[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export interface EnhancedTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading: boolean;
  pagination: PaginationState;
  searchable: boolean;
  onSearch?: (query: string) => void;
  onPageChange: (page: number) => void;
  onRowAction: (action: string, row: T) => void;
}

export interface SearchableDropdownProps {
  options: DropdownOption[];
  value: string;
  onSelect: (value: string) => void;
  placeholder: string;
  searchable?: boolean;
}

export interface AddressFormProps {
  address: DetailedAddress;
  onChange: (address: DetailedAddress) => void;
  title: string;
  copyFromBilling?: boolean;
  onCopyFromBilling?: () => void;
}

export interface ContactPersonFormProps {
  contacts: ContactPerson[];
  onChange: (contacts: ContactPerson[]) => void;
}

export interface CustomerFormTabs {
  otherDetails: CustomerOtherDetailsTabProps;
  address: CustomerAddressTabProps;
  contactPersons: CustomerContactPersonsTabProps;
  remarks: CustomerRemarksTabProps;
}

export interface CustomerOtherDetailsTabProps {
  formData: EnhancedCustomer;
  onUpdate: (data: Partial<EnhancedCustomer>) => void;
  errors: FormErrors;
}

export interface CustomerAddressTabProps {
  formData: EnhancedCustomer;
  onUpdate: (data: Partial<EnhancedCustomer>) => void;
  errors: FormErrors;
}

export interface CustomerContactPersonsTabProps {
  formData: EnhancedCustomer;
  onUpdate: (data: Partial<EnhancedCustomer>) => void;
  errors: FormErrors;
}

export interface CustomerRemarksTabProps {
  formData: EnhancedCustomer;
  onUpdate: (data: Partial<EnhancedCustomer>) => void;
  errors: FormErrors;
}

export interface CustomerListProps {
  customers: EnhancedCustomer[];
  loading: boolean;
  pagination: PaginationState;
  searchQuery: string;
  onSearch: (query: string) => void;
  onPageChange: (page: number) => void;
  onEdit: (customerId: string) => void;
  onDelete: (customerId: string) => void;
}

export interface ItemFormProps {
  item?: EnhancedItem;
  onSave: (item: EnhancedItem) => void;
  onCancel: () => void;
  loading: boolean;
}

export interface ErrorDisplayProps {
  errors: FormErrors;
  field: string;
}

// Form validation interfaces
export interface FormValidationRules {
  customer: {
    name: { required: boolean; minLength: number; maxLength: number };
    email: { format: string; required: boolean };
    gstin: { format: string; required: boolean };
    phone: { format: string; required: boolean };
    addresses: {
      billing: { required: boolean };
      shipping: { required: boolean };
    };
    contactPersons: {
      minCount: number;
      maxCount: number;
      emailRequired: boolean;
    };
  };
  item: {
    name: { required: boolean; minLength: number; maxLength: number };
    sellingPrice: { required: boolean; min: number };
    hsnCode: { format: string; required: boolean };
    taxRates: { min: number; max: number };
  };
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Dashboard: undefined;
  Customers: undefined;
  CustomerDetail: { customerId: string };
  CustomerForm: { customerId?: string };
  Inventory: undefined;
  ItemDetail: { itemId: string };
  ItemForm: { itemId?: string };
  Invoices: undefined;
  InvoiceDetail: { invoiceId: string };
  InvoiceForm: { invoiceId?: string };
  Vendors: undefined;
  VendorDetail: { vendorId: string };
  VendorForm: { vendorId?: string };
  Purchases: undefined;
  PurchaseDetail: { purchaseId: string };
  PurchaseForm: { purchaseId?: string };
  Payments: undefined;
  PaymentDetail: { paymentId: string };
  PaymentForm: { paymentId?: string };
  Expenses: undefined;
  ExpenseDetail: { expenseId: string };
  ExpenseForm: { expenseId?: string };
  Reports: undefined;
  Settings: undefined;
};
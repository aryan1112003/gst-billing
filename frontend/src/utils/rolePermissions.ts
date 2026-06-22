// Role-based permissions configuration

export type UserRole = 'admin' | 'agency' | 'user';

export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  roles: UserRole[]; // Which roles can access this menu item
  businessTypes?: string[]; // Which business types can see this menu item (undefined means all)
}

// Define menu items with role-based access
export const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: 'dashboard',
    route: 'Dashboard',
    roles: ['admin', 'agency', 'user']
  },
  {
    id: 'customers',
    title: 'Customers',
    icon: 'people',
    route: 'Customers',
    roles: ['admin', 'agency', 'user']
  },
  {
    id: 'inventory',
    title: 'Items',
    icon: 'inventory',
    route: 'Inventory',
    roles: ['admin', 'agency', 'user']
  },
  {
    id: 'gate-pass',
    title: 'Gate Pass',
    icon: 'sensor-door',
    route: 'GatePass',
    roles: ['admin', 'agency', 'user'],
    businessTypes: [
      'Machinery Solutions',
      'Importer / Exporter',
      'Transport / Logistics',
    ]
  },
  {
    id: 'quotation',
    title: 'Quotation',
    icon: 'request-quote',
    route: 'Quotation',
    roles: ['admin', 'agency', 'user'],
    businessTypes: [
      'Machinery Solutions',
      'Trader',
      'Wholesaler',
      'Distributor',
      'Contractor',
      'Importer / Exporter',
      'Pharma / Medical',
      'Construction',
      'IT / Software Services',
      'Consulting',
    ]
  },
  {
    id: 'delivery-challan',
    title: 'Delivery Challan',
    icon: 'local-shipping',
    route: 'DeliveryChallan',
    roles: ['admin', 'agency', 'user'],
    businessTypes: [
      'Manufacturer',
      'Machinery Solutions',
      'Manufacturing Services',
      'Manufacturing Tools & Company Service',
      'Job Work-Manufacturer',
      'Auto Spare Parts',
      'Trader',
      'Retailer',
      'Wholesaler',
      'Distributor',
      'Contractor',
      'Importer / Exporter',
      'Pharma / Medical',
      'Construction',
      'Transport / Logistics',
      'Food & Beverages',
      'E-Commerce',
    ]
  },
  {
    id: 'supplier',
    title: 'Supplier',
    icon: 'local-convenience-store',
    route: 'Supplier',
    roles: ['admin', 'agency', 'user'],
    businessTypes: [
      'Manufacturing Tools & Company Service',
      'Job Work-Manufacturer',
      'Contractor',
      'Construction',
    ]
  },
  {
    id: 'purchase-orders',
    title: 'Purchase Orders',
    icon: 'assignment',
    route: 'PurchaseOrders',
    roles: ['admin', 'agency', 'user'],
    businessTypes: [
      'Trader',
      'Wholesaler',
      'Distributor',
      'Retailer',
      'Importer / Exporter',
      'E-Commerce',
    ]
  },
  {
    id: 'production-orders',
    title: 'Production',
    icon: 'precision-manufacturing',
    route: 'ProductionOrders',
    roles: ['admin', 'agency', 'user'],
    businessTypes: [
      'Manufacturer',
      'Manufacturing Services',
      'Manufacturing Tools & Company Service',
      'Job Work-Manufacturer',
    ]
  },
  {
    id: 'bill-of-materials',
    title: 'Bill of Materials',
    icon: 'account-tree',
    route: 'BillOfMaterials',
    roles: ['admin', 'agency', 'user'],
    businessTypes: [
      'Manufacturer',
      'Manufacturing Services',
      'Pharma / Medical',
      'Food & Beverages',
    ]
  },
  {
    id: 'recurring-invoices',
    title: 'Recurring',
    icon: 'autorenew',
    route: 'RecurringInvoices',
    roles: ['admin', 'agency', 'user'],
    businessTypes: [
      'Service Provider',
      'IT / Software Services',
      'Consulting',
    ]
  },
  {
    id: 'time-tracking',
    title: 'Time Tracking',
    icon: 'timer',
    route: 'TimeTracking',
    roles: ['admin', 'agency', 'user'],
    businessTypes: [
      'IT / Software Services',
      'Consulting',
      'Contractor',
    ]
  },
  {
    id: 'projects',
    title: 'Projects',
    icon: 'folder-special',
    route: 'Projects',
    roles: ['admin', 'agency', 'user'],
    businessTypes: [
      'Contractor',
      'Construction',
      'IT / Software Services',
      'Consulting',
    ]
  },
  {
    id: 'trip-sheets',
    title: 'Trip Sheets',
    icon: 'directions-bus',
    route: 'TripSheets',
    roles: ['admin', 'agency', 'user'],
    businessTypes: [
      'Transport / Logistics',
    ]
  },
  {
    id: 'fleet',
    title: 'Fleet',
    icon: 'directions-car',
    route: 'Fleet',
    roles: ['admin', 'agency', 'user'],
    businessTypes: [
      'Transport / Logistics',
      'Auto Spare Parts',
    ]
  },
  {
    id: 'batch-tracking',
    title: 'Batch Tracking',
    icon: 'view-list',
    route: 'BatchTracking',
    roles: ['admin', 'agency', 'user'],
    businessTypes: [
      'Pharma / Medical',
      'Food & Beverages',
    ]
  },
  {
    id: 'customs',
    title: 'Customs / Shipping',
    icon: 'flight',
    route: 'Customs',
    roles: ['admin', 'agency', 'user'],
    businessTypes: [
      'Importer / Exporter',
    ]
  },
  {
    id: 'pos',
    title: 'POS / Counter Sale',
    icon: 'point-of-sale',
    route: 'POS',
    roles: ['admin', 'agency', 'user'],
    businessTypes: [
      'Retailer',
      'Food & Beverages',
    ]
  },
  {
    id: 'invoices',
    title: 'Invoice',
    icon: 'receipt',
    route: 'Invoices',
    roles: ['admin', 'agency', 'user']
  },
  {
    id: 'vendors',
    title: 'Vendors',
    icon: 'business',
    route: 'Vendors',
    roles: ['admin', 'agency', 'user']
  },
  {
    id: 'purchases',
    title: 'Purchase',
    icon: 'shopping-cart',
    route: 'Purchases',
    roles: ['admin', 'agency', 'user']
  },
  {
    id: 'payments',
    title: 'Payments',
    icon: 'payment',
    route: 'Payments',
    roles: ['admin', 'agency', 'user']
  },
  {
    id: 'expenses',
    title: 'Expenses',
    icon: 'money-off',
    route: 'Expenses',
    roles: ['admin', 'agency', 'user']
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: 'assessment',
    route: 'Reports',
    roles: ['admin', 'agency']
  },
  {
    id: 'users',
    title: 'Users',
    icon: 'person',
    route: 'Users',
    roles: ['admin', 'agency']
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'settings',
    route: 'Settings',
    roles: ['admin', 'agency']
  },
];

// Filter menu items based on user role and business type
export const getMenuItems = (role: UserRole, accountType?: string, businessType?: string): MenuItem[] => {
  return menuItems.filter(item => {
    // Check role permission
    const hasRole = item.roles.includes(role);
    if (!hasRole) return false;

    // Check account type restriction (Personal users can't manage other users)
    if (accountType === 'user' && item.id === 'users') return false;

    // If item has businessTypes restriction:
    if (item.businessTypes && item.businessTypes.length > 0) {
      // If agency hasn't set a business type yet → show all (no restriction)
      if (!businessType) return true;
      // Otherwise strictly filter: only show if business type is in the allowed list
      return item.businessTypes.includes(businessType);
    }

    // No businessTypes restriction on item → always show
    return true;
  });
};

// Check if user has permission to access a route
export const canAccessRoute = (role: UserRole, accountType: string, route: string, businessType?: string): boolean => {
  const item = menuItems.find(m => m.route === route);

  if (!item) {
    // If route is not in menu items (e.g. sub-screens like ItemForm), 
    // we default to allowing access, assuming parent route checks occurred
    // or it's a shared screen.
    return true;
  }

  // Check role permission
  if (!item.roles.includes(role)) return false;

  // Check account type restriction
  if (accountType === 'user' && item.id === 'users') {
    return false;
  }

  // Check business type permission if specified for the item
  if (item.businessTypes && item.businessTypes.length > 0) {
    if (!businessType) return true; // If user has no business type, allow access by default
    if (!item.businessTypes.includes(businessType)) return false;
  }

  return true;
};

// Role descriptions
export const roleDescriptions: Record<UserRole, string> = {
  admin: 'System Super Admin',
  agency: 'Account Owner',
  user: 'Staff Member',
};

// Dashboard permissions
export interface DashboardPermissions {
  canViewFinancials: boolean;
  canViewCustomers: boolean;
  canViewInventory: boolean;
  canViewReports: boolean;
  canCreateInvoices: boolean;
  canManageUsers: boolean;
}

export const getDashboardPermissions = (role: UserRole, accountType?: string): DashboardPermissions => {
  let basePermissions: DashboardPermissions;

  switch (role) {
    case 'admin':
      basePermissions = {
        canViewFinancials: true,
        canViewCustomers: true,
        canViewInventory: true,
        canViewReports: true,
        canCreateInvoices: true,
        canManageUsers: true,
      };
      break;
    case 'agency':
      basePermissions = {
        canViewFinancials: true,
        canViewCustomers: true,
        canViewInventory: true,
        canViewReports: true,
        canCreateInvoices: true,
        canManageUsers: true,
      };
      break;
    case 'user':
    default:
      basePermissions = {
        canViewFinancials: false,
        canViewCustomers: false,
        canViewInventory: false,
        canViewReports: false,
        canCreateInvoices: false,
        canManageUsers: false,
      };
      break;
  }

  // Restrict user management for personal accounts regardless of being an owner
  if (accountType === 'user') {
    basePermissions.canManageUsers = false;
  }

  return basePermissions;
};

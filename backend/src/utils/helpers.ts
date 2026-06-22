import { v4 as uuidv4 } from 'uuid';
import { format, addDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// Generate unique identifiers
export const generateInvoiceNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `INV${year}${month}${random}`;
};

export const generateQuotationNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `QTN${year}${month}${random}`;
};

export const generateChallanNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `DC${year}${month}${random}`;
};

export const generatePurchaseNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `PUR${year}${month}${random}`;
};

// Date utilities
export const formatDate = (date: Date, formatString: string = 'yyyy-MM-dd'): string => {
  return format(date, formatString);
};

export const addBusinessDays = (date: Date, days: number): Date => {
  return addDays(date, days);
};

export const getMonthRange = (monthsBack: number = 0): { start: Date; end: Date } => {
  const date = subMonths(new Date(), monthsBack);
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
};

// Number utilities
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const roundToTwoDecimals = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

// Tax calculations
export const calculateGST = (amount: number, gstRate: number = 18): { cgst: number; sgst: number; igst: number; total: number } => {
  const gstAmount = roundToTwoDecimals((amount * gstRate) / 100);
  const cgst = roundToTwoDecimals(gstAmount / 2);
  const sgst = roundToTwoDecimals(gstAmount / 2);
  const igst = gstAmount;
  const total = roundToTwoDecimals(amount + gstAmount);

  return { cgst, sgst, igst, total };
};

// String utilities
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const capitalizeWords = (text: string): string => {
  return text.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

// Array utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const group = String(item[key]);
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

export const sumBy = <T>(array: T[], key: keyof T): number => {
  return array.reduce((sum, item) => sum + Number(item[key]), 0);
};

// Pagination utilities
export const getPaginationMeta = (page: number, limit: number, total: number) => {
  const pages = Math.ceil(total / limit);
  const hasNext = page < pages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    pages,
    hasNext,
    hasPrev,
  };
};

// Database utilities
export const buildWhereClause = (conditions: Record<string, any>): { clause: string; params: any[] } => {
  const clauses: string[] = [];
  const params: any[] = [];
  let paramCount = 0;

  Object.entries(conditions).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      paramCount++;
      if (typeof value === 'string' && key.includes('search')) {
        clauses.push(`${key.replace('_search', '')} ILIKE $${paramCount}`);
        params.push(`%${value}%`);
      } else {
        clauses.push(`${key} = $${paramCount}`);
        params.push(value);
      }
    }
  });

  const clause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  return { clause, params };
};

// File utilities
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

export const generateFileName = (originalName: string, prefix: string = ''): string => {
  const extension = getFileExtension(originalName);
  const timestamp = Date.now();
  const uuid = uuidv4().slice(0, 8);
  return `${prefix}${timestamp}_${uuid}.${extension}`;
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone);
};

export const isValidGSTIN = (gstin: string): boolean => {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
};

export const isValidIFSC = (ifsc: string): boolean => {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc);
};

// Error utilities
export const sanitizeError = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.detail) return error.detail;
  return 'An unexpected error occurred';
};

// Object utilities
export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

// Async utilities
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await delay(delayMs * attempt);
      }
    }
  }

  throw lastError!;
};
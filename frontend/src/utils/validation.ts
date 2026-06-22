import { FormErrors, EnhancedCustomer, EnhancedItem } from '../types';

// Validation utility functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

export const validateGSTIN = (gstin: string): boolean => {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
};

export const validateHSNCode = (hsnCode: string): boolean => {
  const hsnRegex = /^[0-9]{4,8}$/;
  return hsnRegex.test(hsnCode);
};

export const validatePinCode = (pinCode: string, country: string = 'India'): boolean => {
  if (country === 'India') {
    const pinRegex = /^[1-9][0-9]{5}$/;
    return pinRegex.test(pinCode);
  }
  // Add validation for other countries as needed
  return pinCode.length >= 3 && pinCode.length <= 10;
};

// Customer validation
export const validateCustomer = (customer: Partial<EnhancedCustomer>): FormErrors => {
  const errors: FormErrors = {};

  // Name validation
  if (!customer.name || customer.name.trim().length < 2) {
    errors.name = 'Customer name must be at least 2 characters long';
  }
  if (customer.name && customer.name.length > 255) {
    errors.name = 'Customer name must not exceed 255 characters';
  }

  // Email validation
  if (customer.email && !validateEmail(customer.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Phone validation
  if (customer.phone && !validatePhone(customer.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  // GSTIN validation
  if (customer.gstin && !validateGSTIN(customer.gstin)) {
    errors.gstin = 'Please enter a valid GSTIN (e.g., 27ABCDE1234F1Z5)';
  }

  // Billing address validation
  if (customer.billingAddress) {
    const billing = customer.billingAddress;
    if (!billing.street || billing.street.trim().length === 0) {
      errors['billingAddress.street'] = 'Billing address is required';
    }
    if (!billing.city || billing.city.trim().length === 0) {
      errors['billingAddress.city'] = 'City is required';
    }
    if (!billing.state || billing.state.trim().length === 0) {
      errors['billingAddress.state'] = 'State is required';
    }
    if (!billing.zipCode || billing.zipCode.trim().length === 0) {
      errors['billingAddress.zipCode'] = 'ZIP code is required';
    } else if (!validatePinCode(billing.zipCode, billing.country)) {
      errors['billingAddress.zipCode'] = 'Please enter a valid ZIP code';
    }
    if (!billing.country || billing.country.trim().length === 0) {
      errors['billingAddress.country'] = 'Country is required';
    }
  }

  // Contact persons validation
  if (customer.contactPersons && customer.contactPersons.length > 0) {
    customer.contactPersons.forEach((contact, index) => {
      if (!contact.firstName || contact.firstName.trim().length === 0) {
        errors[`contactPersons.${index}.firstName`] = 'First name is required';
      }
      if (!contact.lastName || contact.lastName.trim().length === 0) {
        errors[`contactPersons.${index}.lastName`] = 'Last name is required';
      }
      if (!contact.emailAddress || !validateEmail(contact.emailAddress)) {
        errors[`contactPersons.${index}.emailAddress`] = 'Valid email address is required';
      }
      if (contact.workPhone && !validatePhone(contact.workPhone)) {
        errors[`contactPersons.${index}.workPhone`] = 'Please enter a valid work phone number';
      }
      if (contact.mobile && !validatePhone(contact.mobile)) {
        errors[`contactPersons.${index}.mobile`] = 'Please enter a valid mobile number';
      }
    });
  }

  // Credit limit validation
  if (customer.creditLimit && customer.creditLimit < 0) {
    errors.creditLimit = 'Credit limit cannot be negative';
  }

  // Payment terms validation
  if (customer.paymentTerms && (customer.paymentTerms < 0 || customer.paymentTerms > 365)) {
    errors.paymentTerms = 'Payment terms must be between 0 and 365 days';
  }

  return errors;
};

// Item validation
export const validateItem = (item: Partial<EnhancedItem>): FormErrors => {
  const errors: FormErrors = {};

  // Name validation
  if (!item.name || item.name.trim().length < 2) {
    errors.name = 'Item name must be at least 2 characters long';
  }
  if (item.name && item.name.length > 255) {
    errors.name = 'Item name must not exceed 255 characters';
  }

  // SKU validation
  if (!item.sku || item.sku.trim().length === 0) {
    errors.sku = 'SKU is required';
  }

  // Selling price validation
  if (!item.sellingPrice || item.sellingPrice <= 0) {
    errors.sellingPrice = 'Selling price must be greater than 0';
  }

  // HSN code validation
  if (item.hsnCode && !validateHSNCode(item.hsnCode)) {
    errors.hsnCode = 'Please enter a valid HSN code (4-8 digits)';
  }

  // Tax rate validation
  if (item.intraStateTaxRate && (item.intraStateTaxRate < 0 || item.intraStateTaxRate > 100)) {
    errors.intraStateTaxRate = 'Tax rate must be between 0 and 100';
  }
  if (item.interStateTaxRate && (item.interStateTaxRate < 0 || item.interStateTaxRate > 100)) {
    errors.interStateTaxRate = 'Tax rate must be between 0 and 100';
  }

  // Unit price validation
  if (item.unitPrice && item.unitPrice < 0) {
    errors.unitPrice = 'Unit price cannot be negative';
  }

  // Stock validation
  if (item.currentStock && item.currentStock < 0) {
    errors.currentStock = 'Current stock cannot be negative';
  }
  if (item.reorderLevel && item.reorderLevel < 0) {
    errors.reorderLevel = 'Reorder level cannot be negative';
  }

  return errors;
};

// Utility function to check if form has errors
export const hasFormErrors = (errors: FormErrors): boolean => {
  return Object.keys(errors).length > 0;
};

// Utility function to get error message for a field
export const getFieldError = (errors: FormErrors, field: string): string | undefined => {
  const error = errors[field];
  if (Array.isArray(error)) {
    return error[0];
  }
  return error;
};

// Form validation rules configuration
export const VALIDATION_RULES = {
  customer: {
    name: { required: true, minLength: 2, maxLength: 255 },
    email: { format: 'email', required: false },
    gstin: { format: 'gstin', required: false },
    phone: { format: 'phone', required: false },
    addresses: {
      billing: { required: true },
      shipping: { required: false },
    },
    contactPersons: {
      minCount: 0,
      maxCount: 10,
      emailRequired: true,
    },
  },
  item: {
    name: { required: true, minLength: 2, maxLength: 255 },
    sellingPrice: { required: true, min: 0 },
    hsnCode: { format: 'hsn', required: false },
    taxRates: { min: 0, max: 100 },
  },
} as const;

// Common dropdown options
export const CUSTOMER_TYPES = [
  { label: 'Business', value: 'business' },
  { label: 'Individual', value: 'individual' },
];

export const GST_TREATMENTS = [
  { label: 'Registered Business - Regular', value: 'registered_business_regular' },
  { label: 'Unregistered', value: 'unregistered' },
  { label: 'Consumer', value: 'consumer' },
  { label: 'Tax Exempt', value: 'tax_exempt' },
];

export const TAX_PREFERENCES = [
  { label: 'Taxable', value: 'taxable' },
  { label: 'Tax Exempt', value: 'tax_exempt' },
];

export const CURRENCIES = [
  { label: 'INR - Indian Rupee', value: 'INR' },
  { label: 'USD - US Dollar', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - British Pound', value: 'GBP' },
];

export const ITEM_TYPES = [
  { label: 'Goods', value: 'goods' },
  { label: 'Service', value: 'service' },
];

export const UNITS = [
  { label: 'PCS - Pieces', value: 'PCS' },
  { label: 'DZ - Dozen', value: 'DZ' },
  { label: 'LM - Linear Meter', value: 'LM' },
  { label: 'KG - Kilogram', value: 'KG' },
  { label: 'LTR - Liter', value: 'LTR' },
  { label: 'SQM - Square Meter', value: 'SQM' },
  { label: 'CUM - Cubic Meter', value: 'CUM' },
];

export const SALUTATIONS = [
  { label: 'Mr.', value: 'Mr.' },
  { label: 'Ms.', value: 'Ms.' },
  { label: 'Mrs.', value: 'Mrs.' },
  { label: 'Dr.', value: 'Dr.' },
  { label: 'Prof.', value: 'Prof.' },
];

export const COUNTRIES = [
  { label: 'India', value: 'India' },
  { label: 'United States', value: 'United States' },
  { label: 'United Kingdom', value: 'United Kingdom' },
  { label: 'Canada', value: 'Canada' },
  { label: 'Australia', value: 'Australia' },
];

export const INDIAN_STATES = [
  { label: 'Andhra Pradesh', value: 'Andhra Pradesh' },
  { label: 'Arunachal Pradesh', value: 'Arunachal Pradesh' },
  { label: 'Assam', value: 'Assam' },
  { label: 'Bihar', value: 'Bihar' },
  { label: 'Chhattisgarh', value: 'Chhattisgarh' },
  { label: 'Delhi', value: 'Delhi' },
  { label: 'Goa', value: 'Goa' },
  { label: 'Gujarat', value: 'Gujarat' },
  { label: 'Haryana', value: 'Haryana' },
  { label: 'Himachal Pradesh', value: 'Himachal Pradesh' },
  { label: 'Jharkhand', value: 'Jharkhand' },
  { label: 'Karnataka', value: 'Karnataka' },
  { label: 'Kerala', value: 'Kerala' },
  { label: 'Madhya Pradesh', value: 'Madhya Pradesh' },
  { label: 'Maharashtra', value: 'Maharashtra' },
  { label: 'Manipur', value: 'Manipur' },
  { label: 'Meghalaya', value: 'Meghalaya' },
  { label: 'Mizoram', value: 'Mizoram' },
  { label: 'Nagaland', value: 'Nagaland' },
  { label: 'Odisha', value: 'Odisha' },
  { label: 'Punjab', value: 'Punjab' },
  { label: 'Rajasthan', value: 'Rajasthan' },
  { label: 'Sikkim', value: 'Sikkim' },
  { label: 'Tamil Nadu', value: 'Tamil Nadu' },
  { label: 'Telangana', value: 'Telangana' },
  { label: 'Tripura', value: 'Tripura' },
  { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
  { label: 'Uttarakhand', value: 'Uttarakhand' },
  { label: 'West Bengal', value: 'West Bengal' },
];
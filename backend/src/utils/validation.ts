import Joi from 'joi';

// Common validation schemas
export const idSchema = Joi.alternatives().try(Joi.number().integer(), Joi.string().pattern(/^\d+$/)).required();
export const uuidSchema = idSchema; // Retro-compatibility if needed, but we should use idSchema
export const emailSchema = Joi.string().email().optional().allow('', null);
export const phoneSchema = Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).optional();
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional(),
  type: Joi.string().valid('invoice', 'quotation', 'challan').optional(),
  customerId: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
  status: Joi.string().optional(),
  fromDate: Joi.date().optional(),
  toDate: Joi.date().optional(),
}).unknown(true);

// User validation schemas
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

// Customer validation schemas
export const createCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: emailSchema,
  phone: phoneSchema,
  addressStreet: Joi.string().max(500).optional(),
  addressCity: Joi.string().max(100).optional(),
  addressState: Joi.string().max(100).optional(),
  addressZipCode: Joi.string().max(20).optional(),
  addressCountry: Joi.string().max(100).default('India'),
  gstin: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
  creditLimit: Joi.number().min(0).optional(),
  paymentTerms: Joi.number().integer().min(0).default(30),
}).unknown(true);

export const updateCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  email: emailSchema,
  phone: phoneSchema,
  addressStreet: Joi.string().max(500).optional(),
  addressCity: Joi.string().max(100).optional(),
  addressState: Joi.string().max(100).optional(),
  addressZipCode: Joi.string().max(20).optional(),
  addressCountry: Joi.string().max(100).optional(),
  gstin: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
  creditLimit: Joi.number().min(0).optional(),
  paymentTerms: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
}).unknown(true);

// Item validation schemas
export const createItemSchema = Joi.object({
  sku: Joi.string().min(1).max(100).required(),
  name: Joi.string().min(2).max(255).required(),
  description: Joi.string().max(1000).optional(),
  hsnCode: Joi.string().max(20).optional(),
  unitPrice: Joi.number().min(0).required(),
  currentStock: Joi.number().integer().min(0).default(0),
  reorderLevel: Joi.number().integer().min(0).default(0),
  unit: Joi.string().max(50).default('pcs'),
}).unknown(true);

export const updateItemSchema = Joi.object({
  sku: Joi.string().min(1).max(100).optional(),
  name: Joi.string().min(2).max(255).optional(),
  description: Joi.string().max(1000).optional(),
  hsnCode: Joi.string().max(20).optional(),
  unitPrice: Joi.number().min(0).optional(),
  currentStock: Joi.number().integer().min(0).optional(),
  reorderLevel: Joi.number().integer().min(0).optional(),
  unit: Joi.string().max(50).optional(),
  isActive: Joi.boolean().optional(),
}).unknown(true);

// Vendor validation schemas
export const createVendorSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: emailSchema,
  phone: phoneSchema,
  addressStreet: Joi.string().max(500).optional(),
  addressCity: Joi.string().max(100).optional(),
  addressState: Joi.string().max(100).optional(),
  addressZipCode: Joi.string().max(20).optional(),
  addressCountry: Joi.string().max(100).default('India'),
  gstin: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
  bankAccountNumber: Joi.string().max(50).optional(),
  bankName: Joi.string().max(255).optional(),
  bankIfscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional(),
  bankAccountHolderName: Joi.string().max(255).optional(),
  paymentTerms: Joi.number().integer().min(0).default(30),
}).unknown(true);

export const updateVendorSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  email: emailSchema,
  phone: phoneSchema,
  addressStreet: Joi.string().max(500).optional(),
  addressCity: Joi.string().max(100).optional(),
  addressState: Joi.string().max(100).optional(),
  addressZipCode: Joi.string().max(20).optional(),
  addressCountry: Joi.string().max(100).optional(),
  gstin: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
  bankAccountNumber: Joi.string().max(50).optional(),
  bankName: Joi.string().max(255).optional(),
  bankIfscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional(),
  bankAccountHolderName: Joi.string().max(255).optional(),
  paymentTerms: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
});

// Invoice validation schemas
export const invoiceLineItemSchema = Joi.object({
  itemId: idSchema,
  quantity: Joi.number().min(0.01).required(),
  unitPrice: Joi.number().min(0).required(),
  description: Joi.string().optional().allow('', null),
  taxRate: Joi.number().min(0).optional().default(0),
}).unknown(true);

export const createInvoiceSchema = Joi.object({
  customerId: idSchema,
  issueDate: Joi.date().required(),
  dueDate: Joi.date().min(Joi.ref('issueDate')).required(),
  discountAmount: Joi.number().min(0).default(0),
  notes: Joi.string().max(1000).optional().allow('', null),
  lineItems: Joi.array().items(invoiceLineItemSchema).min(1).required(),
  type: Joi.string().valid('invoice', 'quotation', 'challan').optional().default('invoice'),
  vehicleNumber: Joi.string().optional().allow('', null),
}).unknown(true);

export const updateInvoiceSchema = Joi.object({
  customerId: uuidSchema.optional(),
  issueDate: Joi.date().optional(),
  dueDate: Joi.date().optional(),
  discountAmount: Joi.number().min(0).optional(),
  status: Joi.string().valid('draft', 'sent', 'paid', 'overdue', 'cancelled').optional(),
  notes: Joi.string().max(1000).optional(),
  lineItems: Joi.array().items(invoiceLineItemSchema).min(1).optional(),
}).unknown(true);

// Purchase validation schemas
export const purchaseLineItemSchema = Joi.object({
  itemId: idSchema,
  quantity: Joi.number().min(0.01).required(),
  unitCost: Joi.number().min(0).required(),
});

export const createPurchaseSchema = Joi.object({
  vendorId: uuidSchema,
  purchaseDate: Joi.date().required(),
  notes: Joi.string().max(1000).optional(),
  lineItems: Joi.array().items(purchaseLineItemSchema).min(1).required(),
});

export const updatePurchaseSchema = Joi.object({
  vendorId: uuidSchema.optional(),
  purchaseDate: Joi.date().optional(),
  status: Joi.string().valid('pending', 'delivered', 'cancelled').optional(),
  notes: Joi.string().max(1000).optional(),
  lineItems: Joi.array().items(purchaseLineItemSchema).min(1).optional(),
});

// Payment validation schemas
export const paymentAllocationSchema = Joi.object({
  invoiceId: uuidSchema,
  amount: Joi.number().min(0.01).required(),
});

export const createPaymentSchema = Joi.object({
  customerId: uuidSchema,
  amount: Joi.number().min(0.01).required(),
  paymentDate: Joi.date().required(),
  paymentMode: Joi.string().valid('cash', 'cheque', 'neft', 'upi', 'card').required(),
  referenceNumber: Joi.string().max(100).optional(),
  notes: Joi.string().max(1000).optional(),
  allocations: Joi.array().items(paymentAllocationSchema).optional(),
}).unknown(true);

export const updatePaymentSchema = Joi.object({
  customerId: idSchema.optional(),
  amount: Joi.number().min(0.01).optional(),
  paymentDate: Joi.date().optional(),
  paymentMode: Joi.string().valid('cash', 'cheque', 'neft', 'upi', 'card').optional(),
  referenceNumber: Joi.string().max(100).optional().allow('', null),
  notes: Joi.string().max(1000).optional().allow('', null),
  allocations: Joi.array().items(paymentAllocationSchema).optional(),
}).unknown(true);

// Expense validation schemas
export const createExpenseSchema = Joi.object({
  amount: Joi.number().min(0.01).required(),
  category: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(1000).optional(),
  expenseDate: Joi.date().required(),
  customerId: uuidSchema.optional(),
  receiptUrl: Joi.string().uri().max(500).optional(),
  isBillable: Joi.boolean().default(false),
});

export const updateExpenseSchema = Joi.object({
  amount: Joi.number().min(0.01).optional(),
  category: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(1000).optional(),
  expenseDate: Joi.date().optional(),
  customerId: uuidSchema.optional(),
  receiptUrl: Joi.string().uri().max(500).optional(),
  isBillable: Joi.boolean().optional(),
});

// Validation middleware
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      const { logger } = require('../config/logger');
      logger.warn('❌ Validation failed:', {
        path: req.originalUrl,
        details,
        body: req.body
      });

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details,
        },
      });
    }

    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query validation failed',
          details,
        },
      });
    }

    req.query = value;
    next();
  };
};
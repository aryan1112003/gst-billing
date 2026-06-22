import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { agencyFilter } from '../middleware/agencyFilter';
import { validate, validateQuery } from '../utils/validation';
import { createInvoiceSchema, updateInvoiceSchema, paginationSchema } from '../utils/validation';
import { InvoiceController } from '../controllers/invoiceController';
import { checkInvoiceLimit, checkSubscriptionStatus } from '../middleware/subscriptionLimits';

const router = Router();

// Apply authentication and agency filter to all routes
router.use(authenticate);
router.use(agencyFilter);
router.use(checkSubscriptionStatus); // Check subscription is active

// GET /api/v1/invoices
router.get('/', validateQuery(paginationSchema), InvoiceController.getInvoices);

// GET /api/v1/invoices/:id
router.get('/:id', InvoiceController.getInvoice);

// POST /api/v1/invoices - Check invoice limit before creating
router.post('/',
  authorize(['admin', 'agency']),
  checkInvoiceLimit, // Enforce invoice limit
  validate(createInvoiceSchema),
  InvoiceController.createInvoice
);

// PUT /api/v1/invoices/:id
router.put('/:id',
  authorize(['admin', 'agency']),
  validate(updateInvoiceSchema),
  InvoiceController.updateInvoice
);

// DELETE /api/v1/invoices/:id
router.delete('/:id', authorize(['admin']), InvoiceController.deleteInvoice);

// Email invoice with PDF
router.post('/:id/email',
  authorize(['admin', 'agency']),
  InvoiceController.emailInvoice
);

// Download invoice PDF
router.get('/:id/pdf',
  InvoiceController.downloadInvoicePDF
);

export default router;

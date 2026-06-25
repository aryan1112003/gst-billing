import express, { Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { agencyFilter, addAgencyFilter } from '../middleware/agencyFilter';
import { query, withTransaction } from '../config/database';
import { logger } from '../config/logger';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = express.Router();

// Apply authentication and agency filter
router.use(authenticate);
router.use(agencyFilter);

// Get all payments (mawebtec_lms: table is 'payments_received')
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, customer_id, payment_method, start_date, end_date, page = 1, limit = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = 'WHERE 1=1';
  let params: any[] = [];

  // Add agency filter
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null, 'p');
  whereClause = filtered.whereClause;
  params = filtered.params;

  if (search) {
    whereClause += ` AND (p.reference ILIKE ? OR CONCAT(c.fname, ' ', c.lname) ILIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (customer_id) {
    whereClause += ` AND p.customer_id = ?`;
    params.push(customer_id);
  }

  if (payment_method) {
    whereClause += ` AND p.payment_mode = ?`;
    params.push(payment_method);
  }

  if (start_date) {
    whereClause += ` AND p.payment_date >= ?`;
    params.push(start_date);
  }

  if (end_date) {
    whereClause += ` AND p.payment_date <= ?`;
    params.push(end_date);
  }

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as count FROM payments_received p 
     JOIN customers c ON p.customer_id = c.id 
     ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // Get payments with customer details (mawebtec_lms schema)
  const paymentsResult = await query(
    `SELECT p.id, p.customer_id, p.amount, p.payment_date, p.payment_mode, 
            p.reference as reference_number, p.amount_received, p.bank_charges,
            p.created_date as created_at,
            CONCAT(c.fname, ' ', c.lname) as customer_name, 
            c.customer_email as customer_email
     FROM payments_received p
     JOIN customers c ON p.customer_id = c.id
     ${whereClause}
     ORDER BY p.payment_date DESC, p.created_date DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );

  res.json({
    success: true,
    data: paymentsResult.rows,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      total,
      limit: Number(limit)
    }
  });
}));

// Get customer outstanding balance — must be BEFORE /:id to avoid shadowing
router.get('/customer/:customerId/outstanding', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { customerId } = req.params;

  let whereClause1 = 'WHERE customer_id = ? AND is_deleted = false';
  let params1: any[] = [customerId];
  const filtered1 = addAgencyFilter(whereClause1, params1, req.agencyId ?? null);

  let whereClause2 = 'WHERE customer_id = ?';
  let params2: any[] = [customerId];
  const filtered2 = addAgencyFilter(whereClause2, params2, req.agencyId ?? null);

  const invoicesResult = await query(
    `SELECT COALESCE(SUM(CAST(total_amount AS DECIMAL(10,2))), 0) as total_invoiced
     FROM invoices ${filtered1.whereClause}`,
    filtered1.params
  );

  let totalPaid = 0;
  try {
    const paymentsResult = await query(
      `SELECT COALESCE(SUM(CAST(amount_used_in_payment AS DECIMAL(10,2))), 0) as total_paid
       FROM payments_received ${filtered2.whereClause}`,
      filtered2.params
    );
    totalPaid = parseFloat(paymentsResult.rows[0]?.total_paid || 0);
  } catch {}

  const totalInvoiced = parseFloat(invoicesResult.rows[0]?.total_invoiced || 0);
  const outstanding = totalInvoiced - totalPaid;

  res.json({
    success: true,
    data: {
      customer_id: customerId,
      total_invoiced: totalInvoiced,
      total_paid: totalPaid,
      outstanding_balance: outstanding
    }
  });
}));

// Get payment by ID with invoice allocations
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  let whereClause = 'WHERE p.id = ?';
  let params: any[] = [id];

  // Add agency filter
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null, 'p');
  whereClause = filtered.whereClause;
  params = filtered.params;

  // Get payment details
  const result = await query(
    `SELECT p.id, p.customer_id, p.amount, p.payment_date, p.payment_mode, 
            p.reference as reference_number, p.amount_received, p.bank_charges,
            p.amount_used_in_payment, p.amount_excess,
            p.created_date as created_at,
            CONCAT(c.fname, ' ', c.lname) as customer_name, 
            c.customer_email as customer_email
     FROM payments_received p
     JOIN customers c ON p.customer_id = c.id
     ${whereClause}`,
    params
  );

  if (result.rows.length === 0) {
    throw createError('Payment not found', 404);
  }

  const payment = result.rows[0];

  // Get invoice allocations
  const invoiceAllocations = await query(
    `SELECT ip.id, ip.invoice_id, ip.paid_amount, ip.remaining_balance,
            i.invoice_number, i.total_amount as invoice_total
     FROM invoice_payments ip
     JOIN invoices i ON ip.invoice_id = i.id
     WHERE ip.payment_id = ?`,
    [id]
  );

  payment.invoice_allocations = invoiceAllocations.rows || [];

  res.json({
    success: true,
    data: payment
  });
}));

// Create payment (mawebtec_lms format)
router.post('/', authorize(['admin', 'agency']), asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    customer_id,
    amount,
    payment_date,
    payment_method,
    reference_number,
    bank_charges = 0,
    invoice_allocations = []
  } = req.body;

  if (!customer_id || !amount || !payment_date || !payment_method) {
    throw createError('Customer, amount, payment date, and payment method are required', 400);
  }

  // Get user's agency_id
  const agencyId = req.agencyId ?? req.user?.agencyId ?? null;

  // Verify customer exists in same agency
  let whereClause = 'WHERE id = ?';
  let params: any[] = [customer_id];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);

  const customerCheck = await query(`SELECT id FROM customers ${filtered.whereClause}`, filtered.params);
  if (customerCheck.rows.length === 0) {
    throw createError('Customer not found', 404);
  }

  // Calculate amounts
  const amountReceived = parseFloat(amount) - parseFloat(bank_charges);
  let amountUsed = 0;

  if (invoice_allocations && invoice_allocations.length > 0) {
    amountUsed = invoice_allocations.reduce((sum: number, alloc: any) =>
      sum + parseFloat(alloc.amount || 0), 0);
  }

  const amountExcess = amountReceived - amountUsed;
  const userId = req.user?.id || 1;

  const insertId = await withTransaction(async (tq) => {
    const result = await tq(
      `INSERT INTO payments_received (
        customer_id, amount, bank_charges, reference, payment_date,
        payment, payment_mode, tax_deducted, withholding_amount,
        amount_received, amount_used_in_payment, amount_refund, amount_excess,
        agency_id, created_by, created_date, updated_by, updated_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, false, '0', ?, ?, '0', ?, ?, ?, NOW(), ?, NOW())`,
      [
        customer_id, amount, bank_charges, reference_number || '',
        payment_date, amount, payment_method,
        amountReceived, amountUsed, amountExcess,
        agencyId, userId, userId
      ]
    );

    const newId = result.insertId;

    if (invoice_allocations && invoice_allocations.length > 0) {
      for (const allocation of invoice_allocations) {
        await tq(
          `INSERT INTO invoice_payments (
            invoice_id, customer_id, payment_id, invoice_balanced_amount,
            withholding_tax, paid_amount, remaining_balance,
            agency_id, created_by, created_date, updated_by, updated_date
          ) VALUES (?, ?, ?, ?, '0', ?, ?, ?, ?, NOW(), ?, NOW())`,
          [
            allocation.invoice_id, customer_id, newId,
            allocation.invoice_balance || 0, allocation.amount,
            allocation.remaining_balance || 0,
            agencyId, userId, userId
          ]
        );
      }
    }

    return newId;
  });

  const paymentResult = await query(
    `SELECT p.*, CONCAT(c.fname, ' ', c.lname) as customer_name
     FROM payments_received p
     JOIN customers c ON p.customer_id = c.id
     WHERE p.id = ?`,
    [insertId]
  );

  logger.info('Payment created', { paymentId: insertId, customer_id, amount });

  res.status(201).json({
    success: true,
    data: paymentResult.rows[0],
    message: 'Payment created successfully'
  });
}));

// Update payment (mawebtec_lms format)
router.put('/:id', authorize(['admin', 'agency']), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    customer_id,
    amount,
    payment_date,
    payment_method,
    reference_number,
    bank_charges
  } = req.body;

  // Check if payment exists with agency filter
  let whereClause = 'WHERE id = ?';
  let params: any[] = [id];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);

  const existingPayment = await query(`SELECT id FROM payments_received ${filtered.whereClause}`, filtered.params);
  if (existingPayment.rows.length === 0) {
    throw createError('Payment not found', 404);
  }

  // Verify customer exists in same agency if provided
  if (customer_id) {
    let whereClause2 = 'WHERE id = ?';
    let params2: any[] = [customer_id];
    const filtered2 = addAgencyFilter(whereClause2, params2, req.agencyId ?? null);

    const customerCheck = await query(`SELECT id FROM customers ${filtered2.whereClause}`, filtered2.params);
    if (customerCheck.rows.length === 0) {
      throw createError('Customer not found', 404);
    }
  }

  let updateFields = [];
  let updateParams = [];

  if (customer_id) {
    updateFields.push('customer_id = ?');
    updateParams.push(customer_id);
  }

  if (amount !== undefined) {
    updateFields.push('amount = ?');
    updateParams.push(amount);
    updateFields.push('payment = ?');
    updateParams.push(amount);

    // Recalculate amount_received if bank_charges provided
    if (bank_charges !== undefined) {
      const amountReceived = parseFloat(amount) - parseFloat(bank_charges);
      updateFields.push('amount_received = ?');
      updateParams.push(amountReceived);
    }
  }

  if (payment_date) {
    updateFields.push('payment_date = ?');
    updateParams.push(payment_date);
  }

  if (payment_method !== undefined) {
    updateFields.push('payment_mode = ?');
    updateParams.push(payment_method);
  }

  if (reference_number !== undefined) {
    updateFields.push('reference = ?');
    updateParams.push(reference_number);
  }

  if (bank_charges !== undefined) {
    updateFields.push('bank_charges = ?');
    updateParams.push(bank_charges);
  }

  if (updateFields.length > 0) {
    updateFields.push('updated_by = ?');
    updateParams.push(req.user?.id || 1);
    updateFields.push('updated_date = NOW()');

    await query(
      `UPDATE payments_received SET ${updateFields.join(', ')} WHERE id = ?`,
      [...updateParams, id]
    );
  }

  const paymentResult = await query(
    `SELECT p.*, CONCAT(c.fname, ' ', c.lname) as customer_name 
     FROM payments_received p 
     JOIN customers c ON p.customer_id = c.id 
     WHERE p.id = ?`,
    [id]
  );

  logger.info('Payment updated', { paymentId: id });

  res.json({
    success: true,
    data: paymentResult.rows[0],
    message: 'Payment updated successfully'
  });
}));

// Delete payment (also delete invoice allocations)
router.delete('/:id', authorize(['admin']), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Check if payment exists with agency filter
  let whereClause = 'WHERE id = ?';
  let params: any[] = [id];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);

  const existingPayment = await query(`SELECT id FROM payments_received ${filtered.whereClause}`, filtered.params);
  if (existingPayment.rows.length === 0) {
    throw createError('Payment not found', 404);
  }

  await withTransaction(async (tq) => {
    await tq('DELETE FROM invoice_payments WHERE payment_id = ?', [id]);
    await tq('DELETE FROM payments_received WHERE id = ?', [id]);
  });

  logger.info('Payment deleted', { paymentId: id });

  res.json({
    success: true,
    message: 'Payment deleted successfully'
  });
}));

// Email payment receipt
router.post('/:id/email', authorize(['admin', 'agency']), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { to, cc, subject, message } = req.body;

  let whereClause = 'WHERE p.id = ?';
  let params: any[] = [id];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null, 'p');

  // Get payment details
  const result = await query(
    `SELECT p.id, p.customer_id, p.amount, p.payment_date, p.payment_mode, 
            p.reference as reference_number, p.amount_received,
            CONCAT(c.fname, ' ', c.lname) as customer_name, 
            c.customer_email as customer_email
     FROM payments_received p
     JOIN customers c ON p.customer_id = c.id
     ${filtered.whereClause}`,
    filtered.params
  );

  if (result.rows.length === 0) {
    throw createError('Payment not found', 404);
  }

  const payment = result.rows[0];

  // Get allocations for PDF
  const allocations = await query(
    `SELECT i.invoice_number, ip.paid_amount, i.total_amount as invoice_total
     FROM invoice_payments ip
     JOIN invoices i ON ip.invoice_id = i.id
     WHERE ip.payment_id = ?`,
    [id]
  );

  const paymentData = {
    referenceNumber: payment.reference_number,
    paymentDate: payment.payment_date,
    customerName: payment.customer_name,
    paymentMode: payment.payment_mode,
    amount: payment.amount,
    invoiceAllocations: allocations.rows
  };

  // Generate PDF
  // Dynamic import to avoid circular dependency if any (though unlikely here, safe practice)
  const { pdfService } = await import('../services/pdfService');
  const pdfBuffer = await pdfService.generatePaymentReceiptPDF(paymentData);

  // Send Email
  const { emailService } = await import('../services/emailService');
  await emailService.sendPaymentReceiptEmail(
    to || payment.customer_email, // Default to customer email if not provided
    payment.customer_name,
    payment.reference_number,
    parseFloat(payment.amount),
    new Date(payment.payment_date).toLocaleDateString(),
    pdfBuffer
  );

  res.json({
    success: true,
    message: 'Payment receipt sent successfully'
  });
}));

export default router;

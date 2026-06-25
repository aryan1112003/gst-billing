import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { agencyFilter, addAgencyFilter } from '../middleware/agencyFilter';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { query, withTransaction } from '../config/database';
import { logger } from '../config/logger';
import { AuditService } from '../services/auditService';

const router = express.Router();

// Apply authentication and agency filter middleware to all routes
router.use(authenticate);
router.use(agencyFilter);

// GET /purchases — list all purchases
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, status, vendorId, startDate, endDate, page = 1, limit = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = 'WHERE p.is_deleted = false';
  let queryParams: any[] = [];

  // Add agency filter
  const filtered = addAgencyFilter(whereClause, queryParams, req.agencyId ?? null, 'p');
  whereClause = filtered.whereClause;
  queryParams = filtered.params;

  if (search) {
    whereClause += ` AND (p.purchase_number ILIKE ? OR v.name ILIKE ?)`;
    queryParams.push(`%${search}%`, `%${search}%`);
  }
  if (status) {
    whereClause += ` AND p.status = ?`;
    queryParams.push(status);
  }
  if (vendorId) {
    whereClause += ` AND p.vendor_id = ?`;
    queryParams.push(vendorId);
  }
  if (startDate) {
    whereClause += ` AND p.purchase_date >= ?`;
    queryParams.push(startDate);
  }
  if (endDate) {
    whereClause += ` AND p.purchase_date <= ?`;
    queryParams.push(endDate);
  }

  const countResult = await query(
    `SELECT COUNT(*) as count FROM purchase p LEFT JOIN vendors v ON p.vendor_id = v.id ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0]?.count ?? 0);

  const result = await query(
    `SELECT p.id, p.purchase_number, p.vendor_id, p.purchase_date, p.due_date,
            p.subtotal, p.discount_amount, p.tax_amount, p.total_amount,
            p.paid_amount, p.balance_amount, p.status,
            p.created_date, p.updated_date,
            v.name as vendor_name, v.email as vendor_email, v.phone as vendor_phone
     FROM purchase p
     LEFT JOIN vendors v ON p.vendor_id = v.id
     ${whereClause}
     ORDER BY p.created_date DESC
     LIMIT ? OFFSET ?`,
    [...queryParams, Number(limit), offset]
  );

  res.json({
    success: true,
    data: result.rows || [],
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
}));

// GET /purchases/:id — get single purchase with line items
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  let whereClause = 'WHERE p.id = ? AND p.is_deleted = false';
  let params: any[] = [id];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null, 'p');
  whereClause = filtered.whereClause;
  params = filtered.params;

  const purchaseResult = await query(
    `SELECT p.*,
            v.name as vendor_name, v.email as vendor_email, v.phone as vendor_phone,
            v.gstin as vendor_gstin,
            v.address_street as vendor_address
     FROM purchase p
     LEFT JOIN vendors v ON p.vendor_id = v.id
     ${whereClause}`,
    params
  );

  if (!purchaseResult.rows || purchaseResult.rows.length === 0) {
    throw createError('Purchase not found', 404);
  }

  const purchaseRow = purchaseResult.rows[0];

  // Fetch line items from purchase_items table
  const lineItemsResult = await query(
    `SELECT pi.*, it.item_code, it.hsn_code, it.unit as item_unit
     FROM purchase_items pi
     LEFT JOIN items it ON pi.item_id = it.id
     WHERE pi.purchase_id = ?
     ORDER BY pi.id ASC`,
    [id]
  );

  const lineItems = lineItemsResult.rows.map((item: any) => ({
    id: item.id,
    itemId: item.item_id,
    itemName: item.item_name,
    description: item.description || '',
    quantity: parseFloat(item.quantity ?? 0),
    unit: item.unit || 'pcs',
    unitCost: parseFloat(item.rate ?? 0),
    discountPercent: parseFloat(item.discount_percent ?? 0),
    taxRate: parseFloat(item.tax_rate ?? 0),
    total: parseFloat(item.amount ?? 0),
    hsnSac: item.hsn_code || '',
  }));

  res.json({
    success: true,
    data: {
      ...purchaseRow,
      line_items: lineItems,
    },
  });
}));

// POST /purchases — create new purchase
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { vendorId, purchaseDate, dueDate, paymentTerms, referenceNumber, lineItems, notes, status } = req.body;

  logger.info('Creating purchase with data:', { vendorId, purchaseDate, lineItemsCount: lineItems?.length });

  // Validate required fields
  if (!vendorId || !purchaseDate || !Array.isArray(lineItems) || lineItems.length === 0) {
    throw createError('Vendor ID, purchase date, and at least one line item are required', 400);
  }

  // Verify vendor exists in same agency
  let vendorWhereClause = 'WHERE id = ?';
  let vendorParams: any[] = [vendorId];
  const vendorFiltered = addAgencyFilter(vendorWhereClause, vendorParams, req.agencyId ?? null);
  const vendorCheck = await query(`SELECT id FROM vendors ${vendorFiltered.whereClause}`, vendorFiltered.params);
  if (!vendorCheck.rows || vendorCheck.rows.length === 0) {
    throw createError('Vendor not found', 404);
  }

  // Generate purchase number (agency-scoped to avoid cross-tenant collisions)
  let numWhere = 'WHERE is_deleted = false';
  let numParams: any[] = [];
  const numFiltered = addAgencyFilter(numWhere, numParams, req.agencyId ?? null);
  const countResult = await query(`SELECT COUNT(*) as count FROM purchase ${numFiltered.whereClause}`, numFiltered.params);
  const nextNumber = (parseInt(countResult.rows[0]?.count ?? 0)) + 1;
  const purchaseNumber = `PO-${String(nextNumber).padStart(4, '0')}`;

  // Calculate totals
  let subtotal = 0;
  let taxAmount = 0;
  const processedLineItems = lineItems.map((item: any) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.unitCost) || 0;
    const discountPct = parseFloat(item.discountPercent) || 0;
    const taxRate = parseFloat(item.taxRate) || 0;
    const lineTotal = qty * rate * (1 - discountPct / 100);
    const lineTax = lineTotal * (taxRate / 100);
    subtotal += lineTotal;
    taxAmount += lineTax;
    return {
      item_id: item.itemId || null,
      item_name: item.itemName || item.description || 'Item',
      description: item.description || '',
      quantity: qty,
      unit: item.unit || 'pcs',
      rate,
      discount_percent: discountPct,
      tax_rate: taxRate,
      amount: parseFloat((lineTotal + lineTax).toFixed(2)),
    };
  });

  const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));

  const purchaseId = await withTransaction(async (tq) => {
    const purchaseResult = await tq(
      `INSERT INTO purchase (
        vendor_id, purchase_number, purchase_date, due_date, payment_terms,
        reference_number, subtotal, tax_amount, total_amount, balance_amount,
        status, vendor_notes, agency_id, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vendorId, purchaseNumber, purchaseDate, dueDate || null,
        paymentTerms || null, referenceNumber || null,
        subtotal.toFixed(2), taxAmount.toFixed(2),
        totalAmount.toFixed(2), totalAmount.toFixed(2),
        status || 'draft', notes || null,
        req.agencyId ?? null,
        req.user?.id || 1, req.user?.id || 1,
      ]
    );

    const newId = purchaseResult.insertId;

    for (const li of processedLineItems) {
      await tq(
        `INSERT INTO purchase_items
          (purchase_id, item_id, item_name, description, quantity, unit, rate, discount_percent, tax_rate, amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, li.item_id, li.item_name, li.description, li.quantity, li.unit, li.rate, li.discount_percent, li.tax_rate, li.amount]
      );
    }

    return newId;
  });

  logger.info('Purchase created with ID:', purchaseId);

  const createdPurchase = await query('SELECT * FROM purchase WHERE id = ?', [purchaseId]);

  await AuditService.logAction(
    req.user?.id ? String(req.user.id) : undefined,
    'purchase', purchaseId, 'CREATE', null, createdPurchase.rows[0],
    req.ip, req.get('User-Agent')
  );

  res.status(201).json({
    success: true,
    data: createdPurchase.rows[0],
    message: 'Purchase created successfully',
  });
}));

// PUT /purchases/:id — update purchase
router.put('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { vendorId, purchaseDate, dueDate, status, notes, lineItems } = req.body;

  logger.info('Updating purchase:', { id, vendorId, lineItemsCount: lineItems?.length });

  // Check if purchase exists with agency filter
  let whereClause = 'WHERE id = ? AND is_deleted = false';
  let params: any[] = [id];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);
  const existingPurchase = await query(`SELECT * FROM purchase ${filtered.whereClause}`, filtered.params);

  if (!existingPurchase.rows || existingPurchase.rows.length === 0) {
    throw createError('Purchase not found', 404);
  }

  const existing = existingPurchase.rows[0];

  if (['received', 'billed'].includes(existing.status)) {
    throw createError('Cannot edit a received or billed purchase', 400);
  }

  const updateFields: string[] = [];
  const updateParams: any[] = [];
  let newLineItems: any[] | null = null;

  if (vendorId) { updateFields.push('vendor_id = ?'); updateParams.push(vendorId); }
  if (purchaseDate) { updateFields.push('purchase_date = ?'); updateParams.push(purchaseDate); }
  if (dueDate !== undefined) { updateFields.push('due_date = ?'); updateParams.push(dueDate || null); }
  if (status !== undefined) { updateFields.push('status = ?'); updateParams.push(status); }
  if (notes !== undefined) { updateFields.push('vendor_notes = ?'); updateParams.push(notes); }

  if (Array.isArray(lineItems) && lineItems.length > 0) {
    let subtotal = 0;
    let taxAmount = 0;
    const processedLineItems = lineItems.map((item: any) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.unitCost) || 0;
      const discountPct = parseFloat(item.discountPercent) || 0;
      const taxRate = parseFloat(item.taxRate) || 0;
      const lineTotal = qty * rate * (1 - discountPct / 100);
      const lineTax = lineTotal * (taxRate / 100);
      subtotal += lineTotal;
      taxAmount += lineTax;
      return {
        item_id: item.itemId || null,
        item_name: item.itemName || item.description || 'Item',
        description: item.description || '',
        quantity: qty, unit: item.unit || 'pcs', rate,
        discount_percent: discountPct, tax_rate: taxRate,
        amount: parseFloat((lineTotal + lineTax).toFixed(2)),
      };
    });

    const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));
    const existingPaid = parseFloat(existing.paid_amount ?? 0);
    const newBalance = Math.max(0, totalAmount - existingPaid);
    updateFields.push('subtotal = ?', 'tax_amount = ?', 'total_amount = ?', 'balance_amount = ?');
    updateParams.push(subtotal.toFixed(2), taxAmount.toFixed(2), totalAmount.toFixed(2), newBalance.toFixed(2));
    newLineItems = processedLineItems;
  }

  updateFields.push('updated_by = ?', 'updated_date = NOW()');
  updateParams.push(req.user?.id || 1);

  await withTransaction(async (tq) => {
    if (newLineItems) {
      await tq('DELETE FROM purchase_items WHERE purchase_id = ?', [id]);
      for (const li of newLineItems) {
        await tq(
          `INSERT INTO purchase_items
            (purchase_id, item_id, item_name, description, quantity, unit, rate, discount_percent, tax_rate, amount)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, li.item_id, li.item_name, li.description, li.quantity, li.unit, li.rate, li.discount_percent, li.tax_rate, li.amount]
        );
      }
    }
    if (updateFields.length > 0) {
      await tq(`UPDATE purchase SET ${updateFields.join(', ')} WHERE id = ?`, [...updateParams, id]);
    }
  });

  logger.info('Purchase updated successfully', { id });

  const result = await query('SELECT * FROM purchase WHERE id = ?', [id]);

  await AuditService.logAction(
    req.user?.id ? String(req.user.id) : undefined,
    'purchase', id, 'UPDATE', existing, result.rows[0],
    req.ip, req.get('User-Agent')
  );

  res.json({
    success: true,
    data: result.rows[0],
    message: 'Purchase updated successfully',
  });
}));

// DELETE /purchases/:id — soft delete
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  let whereClause = 'WHERE id = ? AND is_deleted = false';
  let params: any[] = [id];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);
  const existingPurchase = await query(`SELECT id, status FROM purchase ${filtered.whereClause}`, filtered.params);

  if (!existingPurchase.rows || existingPurchase.rows.length === 0) {
    throw createError('Purchase not found', 404);
  }

  if (['received', 'billed'].includes(existingPurchase.rows[0].status)) {
    throw createError('Cannot delete a received or billed purchase', 400);
  }

  await query(
    'UPDATE purchase SET is_deleted = true, updated_by = ?, updated_date = NOW() WHERE id = ?',
    [req.user?.id || 1, id]
  );

  logger.info('Purchase deleted', { id, userId: req.user?.id });

  res.json({
    success: true,
    message: 'Purchase deleted successfully',
  });
}));

// GET /purchases/alerts/pending — list pending purchases
router.get('/alerts/pending', asyncHandler(async (req: AuthRequest, res: Response) => {
  let whereClause = "WHERE p.status = 'pending' AND p.is_deleted = false";
  let params: any[] = [];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null, 'p');
  whereClause = filtered.whereClause;
  params = filtered.params;

  const result = await query(
    `SELECT p.id, p.purchase_number, p.vendor_id, p.purchase_date, p.total_amount,
            v.name as vendor_name, v.email as vendor_email,
            (CURRENT_DATE - p.purchase_date::date) as days_pending
     FROM purchase p
     LEFT JOIN vendors v ON p.vendor_id = v.id
     ${whereClause}
     ORDER BY p.purchase_date ASC`,
    params
  );

  res.json({
    success: true,
    data: result.rows,
    total: result.rowCount,
  });
}));

// POST /purchases/:id/email — send purchase order email
router.post('/:id/email', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { to, cc, subject, message } = req.body;

  logger.info('📧 Sending purchase order email:', { id, to });

  if (!to || !Array.isArray(to) || to.length === 0) {
    throw createError('At least one recipient email is required', 400);
  }

  // Get purchase with agency filter
  let whereClause = 'WHERE p.id = ? AND p.is_deleted = false';
  let params: any[] = [id];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null, 'p');

  const purchaseResult = await query(
    `SELECT p.*, v.name as vendor_name, v.email as vendor_email, v.phone as vendor_phone, v.address_street as vendor_address
     FROM purchase p
     LEFT JOIN vendors v ON p.vendor_id = v.id
     ${filtered.whereClause}`,
    filtered.params
  );

  if (!purchaseResult.rows || purchaseResult.rows.length === 0) {
    throw createError('Purchase order not found', 404);
  }

  const purchaseRow = purchaseResult.rows[0];

  // Fetch line items
  const lineItemsResult = await query(
    `SELECT pi.*, it.hsn_code
     FROM purchase_items pi
     LEFT JOIN items it ON pi.item_id = it.id
     WHERE pi.purchase_id = ?`,
    [id]
  );

  const lineItems = lineItemsResult.rows.map((item: any) => ({
    description: item.item_name || item.description || '',
    hsnSac: item.hsn_code || '',
    quantity: parseFloat(item.quantity ?? 0),
    unitPrice: parseFloat(item.rate ?? 0),
    discount: parseFloat(item.discount_percent ?? 0),
    taxRate: parseFloat(item.tax_rate ?? 0),
    total: parseFloat(item.amount ?? 0),
  }));

  const purchaseData = {
    purchaseNumber: purchaseRow.purchase_number,
    vendor: {
      name: purchaseRow.vendor_name || 'Unknown Vendor',
      email: purchaseRow.vendor_email,
      phone: purchaseRow.vendor_phone,
      address: purchaseRow.vendor_address,
    },
    purchaseDate: purchaseRow.purchase_date,
    subtotal: parseFloat(purchaseRow.subtotal ?? 0),
    taxAmount: parseFloat(purchaseRow.tax_amount ?? 0),
    totalAmount: parseFloat(purchaseRow.total_amount ?? 0),
    notes: purchaseRow.vendor_notes,
    lineItems,
  };

  logger.info('📄 Generating PDF for purchase order...', { purchaseId: id });

  const { pdfService } = await import('../services/pdfService');
  const { emailService } = await import('../services/emailService');

  const pdfBuffer = await pdfService.generatePurchasePDF(purchaseData);
  logger.info('✅ PDF generated successfully', { size: pdfBuffer.length });

  await emailService.sendPurchaseEmail({
    to,
    cc,
    subject: subject || `Purchase Order ${purchaseData.purchaseNumber}`,
    message: message || `Please find attached purchase order ${purchaseData.purchaseNumber}.`,
    purchaseNumber: purchaseData.purchaseNumber,
    vendorName: purchaseData.vendor.name,
    totalAmount: purchaseData.totalAmount,
    pdfBuffer,
  });

  logger.info('✅ Purchase order emailed successfully', { purchaseId: id, to });

  res.json({
    success: true,
    message: 'Purchase order sent successfully via email',
  });
}));

// GET /purchases/:id/pdf — download purchase order PDF
router.get('/:id/pdf', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  let whereClause = 'WHERE p.id = ? AND p.is_deleted = false';
  let params: any[] = [id];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null, 'p');

  const purchaseResult = await query(
    `SELECT p.*, v.name as vendor_name, v.email as vendor_email, v.phone as vendor_phone, v.address_street as vendor_address
     FROM purchase p
     LEFT JOIN vendors v ON p.vendor_id = v.id
     ${filtered.whereClause}`,
    filtered.params
  );

  if (!purchaseResult.rows || purchaseResult.rows.length === 0) {
    throw createError('Purchase order not found', 404);
  }

  const purchaseRow = purchaseResult.rows[0];

  const lineItemsResult = await query(
    `SELECT pi.*, it.hsn_code
     FROM purchase_items pi
     LEFT JOIN items it ON pi.item_id = it.id
     WHERE pi.purchase_id = ?`,
    [id]
  );

  const lineItems = lineItemsResult.rows.map((item: any) => ({
    description: item.item_name || item.description || '',
    hsnSac: item.hsn_code || '',
    quantity: parseFloat(item.quantity ?? 0),
    unitPrice: parseFloat(item.rate ?? 0),
    discount: parseFloat(item.discount_percent ?? 0),
    taxRate: parseFloat(item.tax_rate ?? 0),
    total: parseFloat(item.amount ?? 0),
  }));

  const purchaseData = {
    purchaseNumber: purchaseRow.purchase_number,
    vendor: {
      name: purchaseRow.vendor_name || 'Unknown Vendor',
      email: purchaseRow.vendor_email,
      phone: purchaseRow.vendor_phone,
      address: purchaseRow.vendor_address,
    },
    purchaseDate: purchaseRow.purchase_date,
    subtotal: parseFloat(purchaseRow.subtotal ?? 0),
    taxAmount: parseFloat(purchaseRow.tax_amount ?? 0),
    totalAmount: parseFloat(purchaseRow.total_amount ?? 0),
    notes: purchaseRow.vendor_notes,
    lineItems,
  };

  logger.info('📄 Generating PDF for download...', { purchaseId: id, purchaseNumber: purchaseData.purchaseNumber });

  const { pdfService } = await import('../services/pdfService');
  const pdfBuffer = await pdfService.generatePurchasePDF(purchaseData);

  logger.info('✅ PDF generated successfully', { size: pdfBuffer.length });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=purchase-order-${purchaseData.purchaseNumber}.pdf`);
  res.setHeader('Content-Length', pdfBuffer.length.toString());
  res.send(pdfBuffer);
}));

export default router;

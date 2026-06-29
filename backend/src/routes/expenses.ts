import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { agencyFilter, addAgencyFilter } from '../middleware/agencyFilter';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { query } from '../config/database';
import { logger } from '../config/logger';
import { cloudinaryUpload, uploadToCloudinary, deleteFromCloudinary, extractPublicId, FOLDERS } from '../services/cloudinaryService';

const router = Router();

// Apply authentication and agency filter
router.use(authenticate);
router.use(agencyFilter);

// GET /api/v1/expenses
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, category, start_date, end_date, page = 1, limit = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = 'WHERE 1=1';
  let params: any[] = [];

  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);
  whereClause = filtered.whereClause;
  params = filtered.params;

  if (search) {
    whereClause += ` AND (e.expense_number ILIKE ? OR e.description ILIKE ? OR e.reference_number ILIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category) {
    whereClause += ` AND e.category = ?`;
    params.push(category);
  }
  if (start_date) {
    whereClause += ` AND e.expense_date >= ?`;
    params.push(start_date);
  }
  if (end_date) {
    whereClause += ` AND e.expense_date <= ?`;
    params.push(end_date);
  }

  const countResult = await query(
    `SELECT COUNT(*) as count FROM expenses e ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.count ?? 0);

  const expensesResult = await query(
    `SELECT e.id, e.expense_date, e.category,
            e.amount, e.description, e.is_billable,
            e.receipt_url, e.created_date, e.updated_date
     FROM expenses e
     ${whereClause}
     ORDER BY e.expense_date DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );

  res.json({
    success: true,
    data: expensesResult.rows,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      total,
      limit: Number(limit),
    },
  });
}));

// GET /api/v1/expenses/:id
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  let whereClause = 'WHERE e.id = ?';
  let params: any[] = [id];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null, 'e');
  whereClause = filtered.whereClause;
  params = filtered.params;

  const result = await query(
    `SELECT e.id, e.expense_date, e.category,
            e.amount, e.description, e.is_billable,
            e.receipt_url, e.customer_id, e.created_date, e.updated_date
     FROM expenses e
     ${whereClause}`,
    params
  );

  if (result.rows.length === 0) {
    throw createError('Expense not found', 404);
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
}));

// POST /api/v1/expenses
router.post('/', authorize(['admin', 'agency']), asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    expense_date,
    category,
    vendor_id,
    amount,
    tax_amount = 0,
    payment_mode = 'cash',
    reference_number,
    description,
    is_billable = false,
    invoice_id,
  } = req.body;

  if (!expense_date || !amount) {
    throw createError('Expense date and amount are required', 400);
  }

  const agencyId = req.agencyId ?? req.user?.agencyId ?? null;

  const result = await query(
    `INSERT INTO expenses (
      expense_date, category, amount, description, is_billable, agency_id, created_date, updated_date
    ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      expense_date,
      category || null,
      parseFloat(String(amount)),
      description || null,
      is_billable ? true : false,
      agencyId,
    ]
  );

  logger.info('Expense created', { expenseId: result.insertId, amount, category });

  res.status(201).json({
    success: true,
    data: result.rows[0],
    message: 'Expense created successfully',
  });
}));

// PUT /api/v1/expenses/:id
router.put('/:id', authorize(['admin', 'agency']), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    expense_date,
    category,
    vendor_id,
    amount,
    tax_amount,
    payment_mode,
    reference_number,
    description,
    is_billable,
    invoice_id,
  } = req.body;

  // Check if expense exists with agency filter
  let whereClause = 'WHERE id = ?';
  let params: any[] = [id];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);
  const existingExpense = await query(`SELECT id FROM expenses ${filtered.whereClause}`, filtered.params);
  if (existingExpense.rows.length === 0) {
    throw createError('Expense not found', 404);
  }

  const updateFields: string[] = [];
  const updateParams: any[] = [];

  if (expense_date !== undefined) { updateFields.push('expense_date = ?'); updateParams.push(expense_date); }
  if (category !== undefined) { updateFields.push('category = ?'); updateParams.push(category); }
  if (amount !== undefined) { updateFields.push('amount = ?'); updateParams.push(parseFloat(String(amount))); }
  if (description !== undefined) { updateFields.push('description = ?'); updateParams.push(description); }
  if (is_billable !== undefined) { updateFields.push('is_billable = ?'); updateParams.push(is_billable ? true : false); }

  // Always update audit field
  updateFields.push('updated_date = NOW()');

  updateParams.push(id);
  await query(
    `UPDATE expenses SET ${updateFields.join(', ')} WHERE id = ?`,
    updateParams
  );

  const expenseResult = await query('SELECT * FROM expenses WHERE id = ?', [id]);

  logger.info('Expense updated', { expenseId: id });

  res.json({
    success: true,
    data: expenseResult.rows[0],
    message: 'Expense updated successfully',
  });
}));

// DELETE /api/v1/expenses/:id
router.delete('/:id', authorize(['admin', 'agency']), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Check if expense exists with agency filter
  let whereClause = 'WHERE id = ?';
  let params: any[] = [id];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);
  const existingExpense = await query(`SELECT id FROM expenses ${filtered.whereClause}`, filtered.params);
  if (existingExpense.rows.length === 0) {
    throw createError('Expense not found', 404);
  }

  await query(`DELETE FROM expenses ${filtered.whereClause}`, filtered.params);
  logger.info('Expense deleted', { expenseId: id });

  res.json({
    success: true,
    message: 'Expense deleted successfully',
  });
}));

/**
 * Upload expense receipt to Cloudinary
 * POST /api/expenses/:id/receipt
 */
router.post('/:id/receipt', authorize(['admin', 'agency']), cloudinaryUpload.single('receipt'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!req.file) throw createError('No file uploaded', 400);

  // Verify expense belongs to this agency
  let whereClause = 'WHERE id = ?';
  let params: any[] = [id];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);

  const existing = await query(`SELECT id, receipt_url FROM expenses ${filtered.whereClause}`, filtered.params);
  if (existing.rows.length === 0) throw createError('Expense not found', 404);

  // Delete old receipt from Cloudinary if it exists
  const oldUrl = existing.rows[0].receipt_url;
  if (oldUrl) {
    const oldPublicId = extractPublicId(oldUrl);
    if (oldPublicId) await deleteFromCloudinary(oldPublicId);
  }

  // Upload new receipt
  const result = await uploadToCloudinary(
    req.file.buffer,
    FOLDERS.expenses,
    `expense-${id}-${Date.now()}`
  );

  const receiptUrl: string = result.secure_url;

  await query('UPDATE expenses SET receipt_url = ?, updated_date = NOW() WHERE id = ?', [receiptUrl, id]);

  logger.info('Expense receipt uploaded to Cloudinary', { expenseId: id });

  res.json({
    success: true,
    message: 'Receipt uploaded successfully',
    data: {
      receiptUrl,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    },
  });
}));

export default router;


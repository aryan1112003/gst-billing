import express, { Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { agencyFilter, addAgencyFilter } from '../middleware/agencyFilter';
import { query } from '../config/database';
import { logger } from '../config/logger';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = express.Router();

// The deployed DB vendors table uses customer-style columns:
// fname, lname, company_name, cdisplay_name, customer_email, cmobile_phone,
// cwork_phone, gstin_number, website, gst_treatment, place_of_supply,
// currency_id, is_active, agency_id, created_date, updated_date

const VENDOR_SELECT = `
  id,
  COALESCE(cdisplay_name, CONCAT(TRIM(COALESCE(fname,'')), ' ', TRIM(COALESCE(lname,''))), company_name) as name,
  company_name,
  customer_email as email,
  COALESCE(cmobile_phone, cwork_phone) as phone,
  gstin_number as gstin,
  is_active,
  agency_id,
  created_date,
  updated_date
`;

// Apply authentication and agency filter
router.use(authenticate);
router.use(agencyFilter);

// Get all vendors
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, active, page = 1, limit = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = 'WHERE 1=1';
  let params: any[] = [];

  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);
  whereClause = filtered.whereClause;
  params = filtered.params;

  if (search) {
    whereClause += ` AND (company_name ILIKE ? OR cdisplay_name ILIKE ? OR customer_email ILIKE ? OR cmobile_phone ILIKE ? OR CONCAT(fname,' ',lname) ILIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (active !== undefined) {
    whereClause += ` AND is_active = ?`;
    params.push(active === 'true' ? 1 : 0);
  }

  const countResult = await query(`SELECT COUNT(*) as count FROM vendors ${whereClause}`, params);
  const total = parseInt(countResult.rows[0]?.count ?? 0);

  const vendorsResult = await query(
    `SELECT ${VENDOR_SELECT} FROM vendors ${whereClause}
     ORDER BY COALESCE(cdisplay_name, company_name, fname) ASC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );

  res.json({
    success: true,
    data: vendorsResult.rows,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      total,
      limit: Number(limit)
    }
  });
}));

// Get vendor by ID
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  let whereClause = 'WHERE id = ?';
  let params: any[] = [id];

  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);
  whereClause = filtered.whereClause;
  params = filtered.params;

  const result = await query(
    `SELECT ${VENDOR_SELECT} FROM vendors ${whereClause}`,
    params
  );

  if (result.rows.length === 0) {
    throw createError('Vendor not found', 404);
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
}));

// Create new vendor
router.post('/', authorize(['admin', 'agency']), asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    name,
    email,
    phone,
    company_name,
    gstin,
    website,
  } = req.body;

  const vendorName = name || company_name;
  if (!vendorName) {
    throw createError('Vendor name or company name is required', 400);
  }

  // Split name for fname/lname
  const nameParts = vendorName.trim().split(' ');
  const fname = nameParts[0] || '';
  const lname = nameParts.slice(1).join(' ') || '';

  // Check email uniqueness in agency
  if (email) {
    let emailWhere = 'WHERE customer_email = ? AND is_active = 1';
    let emailParams: any[] = [email];
    const emailFiltered = addAgencyFilter(emailWhere, emailParams, req.agencyId ?? null);
    const existing = await query(`SELECT id FROM vendors ${emailFiltered.whereClause}`, emailFiltered.params);
    if (existing.rows.length > 0) {
      throw createError('Vendor with this email already exists', 400);
    }
  }

  const agencyId = req.agencyId ?? req.user?.agencyId ?? null;

  const result = await query(
    `INSERT INTO vendors (
       fname, lname, company_name, cdisplay_name, customer_email, cmobile_phone,
       gstin_number, website, is_active, agency_id, created_by, created_date, updated_by, updated_date
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NOW(), ?, NOW())`,
    [
      fname, lname,
      company_name || vendorName,
      vendorName,
      email || '',
      phone || '',
      gstin || '',
      website || '',
      agencyId,
      req.user?.id || 1,
      req.user?.id || 1,
    ]
  );

  const insertId = result.insertId;
  const vendorResult = await query(`SELECT ${VENDOR_SELECT} FROM vendors WHERE id = ?`, [insertId]);

  logger.info('Vendor created', { vendorId: insertId, name: vendorName });

  res.status(201).json({
    success: true,
    data: vendorResult.rows[0],
    message: 'Vendor created successfully'
  });
}));

// Update vendor
router.put('/:id', authorize(['admin', 'agency']), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, email, phone, company_name, gstin, website, is_active } = req.body;

  let whereClause = 'WHERE id = ?';
  let params: any[] = [id];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);

  const existing = await query(`SELECT id FROM vendors ${filtered.whereClause}`, filtered.params);
  if (existing.rows.length === 0) {
    throw createError('Vendor not found', 404);
  }

  const updates: string[] = [];
  const updateParams: any[] = [];

  if (name !== undefined) {
    const nameParts = name.trim().split(' ');
    updates.push('fname = ?, lname = ?, cdisplay_name = ?');
    updateParams.push(nameParts[0] || '', nameParts.slice(1).join(' ') || '', name);
  }
  if (company_name !== undefined) { updates.push('company_name = ?'); updateParams.push(company_name); }
  if (email !== undefined) { updates.push('customer_email = ?'); updateParams.push(email); }
  if (phone !== undefined) { updates.push('cmobile_phone = ?'); updateParams.push(phone); }
  if (gstin !== undefined) { updates.push('gstin_number = ?'); updateParams.push(gstin); }
  if (website !== undefined) { updates.push('website = ?'); updateParams.push(website); }
  if (is_active !== undefined) { updates.push('is_active = ?'); updateParams.push(is_active ? 1 : 0); }

  if (updates.length === 0) {
    throw createError('No fields to update', 400);
  }

  updates.push('updated_date = NOW()');
  updateParams.push(id);

  await query(`UPDATE vendors SET ${updates.join(', ')} WHERE id = ?`, updateParams);

  const vendorResult = await query(`SELECT ${VENDOR_SELECT} FROM vendors WHERE id = ?`, [id]);

  logger.info('Vendor updated', { vendorId: id });

  res.json({
    success: true,
    data: vendorResult.rows[0],
    message: 'Vendor updated successfully'
  });
}));

// Delete vendor
router.delete('/:id', authorize(['admin', 'agency']), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  let whereClause = 'WHERE id = ?';
  let params: any[] = [id];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);

  const existing = await query(`SELECT id FROM vendors ${filtered.whereClause}`, filtered.params);
  if (existing.rows.length === 0) {
    throw createError('Vendor not found', 404);
  }

  // Soft delete — set is_active = 0
  await query('UPDATE vendors SET is_active = 0, updated_date = NOW() WHERE id = ?', [id]);
  logger.info('Vendor deactivated', { vendorId: id });

  res.json({
    success: true,
    message: 'Vendor deleted successfully'
  });
}));

export default router;

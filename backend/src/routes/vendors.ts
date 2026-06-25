import express, { Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { agencyFilter, addAgencyFilter } from '../middleware/agencyFilter';
import { query } from '../config/database';
import { logger } from '../config/logger';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = express.Router();

// Apply authentication and agency filter
router.use(authenticate);
router.use(agencyFilter);

// Get all vendors
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, active, page = 1, limit = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = 'WHERE 1=1';
  let params: any[] = [];

  // Add agency filter
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);
  whereClause = filtered.whereClause;
  params = filtered.params;

  if (search) {
    whereClause += ` AND (name ILIKE ? OR email ILIKE ? OR phone ILIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (active !== undefined) {
    whereClause += ` AND is_active = ?`;
    params.push(active === 'true' ? true : false);
  }

  // Get total count
  const countResult = await query(`SELECT COUNT(*) as count FROM vendors ${whereClause}`, params);
  const total = parseInt(countResult.rows[0]?.count ?? 0);

  const vendorsResult = await query(
    `SELECT
       id,
       name,
       email,
       phone,
       address_street as address,
       address_city as city,
       address_state as state,
       address_zip_code as zip_code,
       address_country,
       gstin,
       bank_name,
       bank_account_number as account_number,
       bank_ifsc_code as ifsc_code,
       bank_account_holder_name,
       payment_terms,
       is_active,
       created_at,
       updated_at
     FROM vendors ${whereClause}
     ORDER BY name ASC
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

  // Add agency filter
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);
  whereClause = filtered.whereClause;
  params = filtered.params;

  const result = await query(
    `SELECT
       id,
       name,
       email,
       phone,
       address_street as address,
       address_city as city,
       address_state as state,
       address_zip_code as zip_code,
       address_country,
       gstin,
       bank_name,
       bank_account_number as account_number,
       bank_ifsc_code as ifsc_code,
       bank_account_holder_name,
       payment_terms,
       is_active,
       created_at,
       updated_at
     FROM vendors ${whereClause}`,
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
    mobile,
    gstin,
    pan_number,
    company_name,
    address,
    city,
    state,
    zip_code,
    website,
    bank_name,
    bank_branch,
    account_number,
    account_type,
    ifsc_code,
    remark,
  } = req.body;

  const vendorName = name || company_name;
  if (!vendorName) {
    throw createError('Vendor name or company name is required', 400);
  }

  // Check if email already exists in same agency
  if (email) {
    let emailWhere = 'WHERE email = ?';
    let emailParams: any[] = [email];
    const emailFiltered = addAgencyFilter(emailWhere, emailParams, req.agencyId ?? null);
    const existingVendor = await query(`SELECT id FROM vendors ${emailFiltered.whereClause}`, emailFiltered.params);
    if (existingVendor.rows.length > 0) {
      throw createError('Vendor with this email already exists', 400);
    }
  }

  const agencyId = req.agencyId ?? req.user?.agencyId ?? null;

  const result = await query(
    `INSERT INTO vendors (
       name, email, phone,
       address_street, address_city, address_state, address_zip_code, address_country,
       gstin, bank_name, bank_account_number, bank_ifsc_code, bank_account_holder_name,
       payment_terms, is_active, agency_id, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, ?, NOW(), NOW())`,
    [
      vendorName,
      email || null,
      phone || null,
      address || null,
      city || null,
      state || null,
      zip_code || null,
      'India',
      gstin || null,
      bank_name || null,
      account_number || null,
      ifsc_code || null,
      null, // bank_account_holder_name — not provided in form
      30,
      agencyId,
    ]
  );

  const insertId = result.insertId;
  const vendorResult = await query(
    `SELECT id, name, email, phone, address_street as address, address_city as city,
            address_state as state, gstin, bank_name, bank_account_number as account_number,
            bank_ifsc_code as ifsc_code, is_active, created_at, updated_at
     FROM vendors WHERE id = ?`,
    [insertId]
  );

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
  const {
    name,
    email,
    phone,
    mobile,
    gstin,
    pan_number,
    company_name,
    address,
    city,
    state,
    zip_code,
    website,
    bank_name,
    bank_branch,
    account_number,
    account_type,
    ifsc_code,
    remark,
    is_active,
  } = req.body;

  // Check if vendor exists with agency filter
  let whereClause = 'WHERE id = ?';
  let params: any[] = [id];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);

  const existingVendor = await query(`SELECT id FROM vendors ${filtered.whereClause}`, filtered.params);
  if (existingVendor.rows.length === 0) {
    throw createError('Vendor not found', 404);
  }

  // Check if email already taken by another vendor in the same agency
  if (email) {
    let emailWhere = 'WHERE email = ? AND id != ?';
    let emailParams: any[] = [email, id];
    const emailFiltered = addAgencyFilter(emailWhere, emailParams, req.agencyId ?? null);
    const emailCheck = await query(`SELECT id FROM vendors ${emailFiltered.whereClause}`, emailFiltered.params);
    if (emailCheck.rows.length > 0) {
      throw createError('Vendor with this email already exists', 400);
    }
  }

  const updates: string[] = [];
  const updateParams: any[] = [];

  if (name !== undefined) { updates.push('name = ?'); updateParams.push(name); }
  if (email !== undefined) { updates.push('email = ?'); updateParams.push(email); }
  if (phone !== undefined) { updates.push('phone = ?'); updateParams.push(phone); }
  if (address !== undefined) { updates.push('address_street = ?'); updateParams.push(address); }
  if (city !== undefined) { updates.push('address_city = ?'); updateParams.push(city); }
  if (state !== undefined) { updates.push('address_state = ?'); updateParams.push(state); }
  if (zip_code !== undefined) { updates.push('address_zip_code = ?'); updateParams.push(zip_code); }
  if (gstin !== undefined) { updates.push('gstin = ?'); updateParams.push(gstin); }
  if (bank_name !== undefined) { updates.push('bank_name = ?'); updateParams.push(bank_name); }
  if (account_number !== undefined) { updates.push('bank_account_number = ?'); updateParams.push(account_number); }
  if (ifsc_code !== undefined) { updates.push('bank_ifsc_code = ?'); updateParams.push(ifsc_code); }
  if (is_active !== undefined) { updates.push('is_active = ?'); updateParams.push(is_active ? true : false); }

  if (updates.length === 0) {
    throw createError('No fields to update', 400);
  }

  updates.push('updated_at = NOW()');
  updateParams.push(id);

  await query(
    `UPDATE vendors SET ${updates.join(', ')} WHERE id = ?`,
    updateParams
  );

  const vendorResult = await query(
    `SELECT id, name, email, phone, address_street as address, address_city as city,
            address_state as state, gstin, bank_name, bank_account_number as account_number,
            bank_ifsc_code as ifsc_code, is_active, created_at, updated_at
     FROM vendors WHERE id = ?`,
    [id]
  );

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

  // Check if vendor exists with agency filter
  let whereClause = 'WHERE id = ?';
  let params: any[] = [id];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);

  const existingVendor = await query(`SELECT id FROM vendors ${filtered.whereClause}`, filtered.params);
  if (existingVendor.rows.length === 0) {
    throw createError('Vendor not found', 404);
  }

  // Check if vendor has associated purchases
  const purchasesCheck = await query('SELECT COUNT(*) as count FROM purchases WHERE vendor_id = ?', [id]);

  if (parseInt(purchasesCheck.rows[0]?.count ?? 0) > 0) {
    // Soft delete
    await query('UPDATE vendors SET is_active = false, updated_at = NOW() WHERE id = ?', [id]);
    logger.info('Vendor deactivated (has associated purchases)', { vendorId: id });

    return res.json({
      success: true,
      message: 'Vendor deactivated successfully (has associated purchases)'
    });
  }

  // Hard delete
  await query('DELETE FROM vendors WHERE id = ?', [id]);
  logger.info('Vendor deleted', { vendorId: id });

  res.json({
    success: true,
    message: 'Vendor deleted successfully'
  });
}));

export default router;

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
    whereClause += ` AND (vendor_name LIKE ? OR vendor_email LIKE ? OR vendor_phone LIKE ? OR company_name LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (active !== undefined) {
    whereClause += ` AND is_active = ?`;
    params.push(active === 'true' ? 1 : 0);
  }

  // Get total count
  const countResult = await query(`SELECT COUNT(*) as count FROM vendors ${whereClause}`, params);
  const total = parseInt(countResult.rows[0]?.count ?? 0);

  const vendorsResult = await query(
    `SELECT
       id,
       vendor_name as name,
       vendor_email as email,
       COALESCE(vendor_phone, vendor_mobile) as phone,
       address,
       city,
       state,
       zip_code,
       gstin_number as gstin,
       pan_number,
       company_name,
       website,
       is_active,
       created_date as created_at,
       updated_date as updated_at
     FROM vendors ${whereClause}
     ORDER BY vendor_name ASC
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
       vendor_name as name,
       vendor_email as email,
       vendor_phone as phone,
       vendor_mobile,
       address,
       city,
       state,
       zip_code,
       gstin_number as gstin,
       pan_number,
       company_name,
       website,
       bank_name,
       bank_branch,
       account_number,
       account_type,
       ifsc_code,
       remark,
       is_active,
       created_date as created_at,
       updated_date as updated_at
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
    let emailWhere = 'WHERE vendor_email = ?';
    let emailParams: any[] = [email];
    const emailFiltered = addAgencyFilter(emailWhere, emailParams, req.agencyId ?? null);
    const existingVendor = await query(`SELECT id FROM vendors ${emailFiltered.whereClause}`, emailFiltered.params);
    if (existingVendor.rows.length > 0) {
      throw createError('Vendor with this email already exists', 400);
    }
  }

  const agencyId = req.agencyId ?? req.user?.agencyId ?? 1;

  const result = await query(
    `INSERT INTO vendors (
       agency_id, vendor_name, vendor_email, vendor_phone, vendor_mobile, company_name,
       address, city, state, zip_code, gstin_number, pan_number, website,
       bank_name, bank_branch, account_number, account_type, ifsc_code, remark,
       is_active, created_by, created_date, updated_by, updated_date
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NOW(), ?, NOW())`,
    [
      agencyId,
      vendorName,
      email || '',
      phone || '',
      mobile || phone || '',
      company_name || vendorName,
      address || '',
      city || '',
      state || '',
      zip_code || '',
      gstin || '',
      pan_number || '',
      website || '',
      bank_name || '',
      bank_branch || '',
      account_number || '',
      account_type || '',
      ifsc_code || '',
      remark || '',
      req.user?.id || 1,
      req.user?.id || 1,
    ]
  );

  const insertId = result.insertId;
  const vendorResult = await query(
    `SELECT id, vendor_name as name, vendor_email as email,
            COALESCE(vendor_phone, vendor_mobile) as phone,
            address, gstin_number as gstin, company_name,
            created_date as created_at, updated_date as updated_at
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

  // Check if email already taken by another vendor
  if (email) {
    const emailCheck = await query('SELECT id FROM vendors WHERE vendor_email = ? AND id != ?', [email, id]);
    if (emailCheck.rows.length > 0) {
      throw createError('Vendor with this email already exists', 400);
    }
  }

  const updates: string[] = [];
  const updateParams: any[] = [];

  if (name !== undefined) { updates.push('vendor_name = ?'); updateParams.push(name); }
  if (email !== undefined) { updates.push('vendor_email = ?'); updateParams.push(email); }
  if (phone !== undefined) { updates.push('vendor_phone = ?'); updateParams.push(phone); }
  if (mobile !== undefined) { updates.push('vendor_mobile = ?'); updateParams.push(mobile); }
  if (company_name !== undefined) { updates.push('company_name = ?'); updateParams.push(company_name); }
  if (address !== undefined) { updates.push('address = ?'); updateParams.push(address); }
  if (city !== undefined) { updates.push('city = ?'); updateParams.push(city); }
  if (state !== undefined) { updates.push('state = ?'); updateParams.push(state); }
  if (zip_code !== undefined) { updates.push('zip_code = ?'); updateParams.push(zip_code); }
  if (gstin !== undefined) { updates.push('gstin_number = ?'); updateParams.push(gstin); }
  if (pan_number !== undefined) { updates.push('pan_number = ?'); updateParams.push(pan_number); }
  if (website !== undefined) { updates.push('website = ?'); updateParams.push(website); }
  if (bank_name !== undefined) { updates.push('bank_name = ?'); updateParams.push(bank_name); }
  if (bank_branch !== undefined) { updates.push('bank_branch = ?'); updateParams.push(bank_branch); }
  if (account_number !== undefined) { updates.push('account_number = ?'); updateParams.push(account_number); }
  if (account_type !== undefined) { updates.push('account_type = ?'); updateParams.push(account_type); }
  if (ifsc_code !== undefined) { updates.push('ifsc_code = ?'); updateParams.push(ifsc_code); }
  if (remark !== undefined) { updates.push('remark = ?'); updateParams.push(remark); }
  if (is_active !== undefined) { updates.push('is_active = ?'); updateParams.push(is_active ? 1 : 0); }

  if (updates.length === 0) {
    throw createError('No fields to update', 400);
  }

  updates.push('updated_date = NOW()', 'updated_by = ?');
  updateParams.push(req.user?.id || 1);
  updateParams.push(id);

  await query(
    `UPDATE vendors SET ${updates.join(', ')} WHERE id = ?`,
    updateParams
  );

  const vendorResult = await query(
    `SELECT id, vendor_name as name, vendor_email as email,
            COALESCE(vendor_phone, vendor_mobile) as phone,
            address, gstin_number as gstin, company_name,
            created_date as created_at, updated_date as updated_at
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
  const purchasesCheck = await query('SELECT COUNT(*) as count FROM purchase WHERE vendor_id = ?', [id]);

  if (parseInt(purchasesCheck.rows[0]?.count ?? 0) > 0) {
    // Soft delete
    await query('UPDATE vendors SET is_active = 0, updated_date = NOW(), updated_by = ? WHERE id = ?', [req.user?.id || 1, id]);
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

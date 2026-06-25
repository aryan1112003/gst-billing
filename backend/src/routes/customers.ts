import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { agencyFilter, addAgencyFilter } from '../middleware/agencyFilter';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { query } from '../config/database';
import { logger } from '../config/logger';

const router = Router();

// Apply authentication and agency filter to all routes
router.use(authenticate);
router.use(agencyFilter);

// GET /api/v1/customers
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, page = 1, limit = 10, active } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = 'WHERE 1=1';
  let params: any[] = [];

  // Add agency filter (system admin sees all, agency users see only their data)
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);
  whereClause = filtered.whereClause;
  params = filtered.params;

  if (search) {
    whereClause += ` AND (CONCAT(fname, ' ', lname) ILIKE ? OR customer_email ILIKE ? OR cwork_phone ILIKE ? OR cmobile_phone ILIKE ? OR company_name ILIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (active !== undefined) {
    whereClause += ` AND is_active = ?`;
    params.push(active === 'true' ? true : false);
  }

  // Get total count
  const countResult = await query(`SELECT COUNT(*) as count FROM customers ${whereClause}`, params);
  const total = countResult.rows && countResult.rows.length > 0 ? parseInt(countResult.rows[0].count) : 0;

  // Get customers with mapped column names
  const customersResult = await query(
    `SELECT 
       id, 
       CONCAT(fname, ' ', lname) as name,
       customer_email as email,
       COALESCE(cwork_phone, cmobile_phone) as phone,
       '' as address,
       gstin_number as gstin,
       company_name,
       cdisplay_name as display_name,
       is_active,
       created_date as created_at,
       updated_date as updated_at
     FROM customers ${whereClause} 
     ORDER BY fname ASC 
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );

  const customers = customersResult.rows || [];

  res.json({
    success: true,
    data: customers,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      total,
      limit: Number(limit)
    }
  });
}));

// GET /api/v1/customers/:id
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
       CONCAT(fname, ' ', lname) as name,
       customer_email as email,
       COALESCE(cwork_phone, cmobile_phone) as phone,
       '' as address,
       gstin_number as gstin,
       company_name,
       cdisplay_name as display_name,
       website,
       is_active,
       agency_id,
       created_date as created_at,
       updated_date as updated_at
     FROM customers ${whereClause}`,
    params
  );

  if (result.rows.length === 0) {
    throw createError('Customer not found', 404);
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
}));

// POST /api/v1/customers
router.post('/', authorize(['admin', 'agency']), asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    name,
    email,
    phone,
    address,
    gstin,
    company_name
  } = req.body;

  if (!name && !company_name) {
    throw createError('Customer name or company name is required', 400);
  }

  // Validate email format
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError('Invalid email format', 400);
  }

  // Validate GSTIN (Indian GST registration number)
  if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
    throw createError('Invalid GSTIN format', 400);
  }

  // Validate phone (allow +countrycode + 7-15 digits)
  if (phone && !/^\+?[1-9]\d{6,14}$/.test(phone.replace(/[\s\-().]/g, ''))) {
    throw createError('Invalid phone number format', 400);
  }

  // Split name into first and last name
  const nameParts = (name || company_name || '').trim().split(' ');
  const fname = nameParts[0] || '';
  const lname = nameParts.slice(1).join(' ') || '';

  // Check if email already exists in this agency
  if (email) {
    let whereClause = 'WHERE customer_email = ?';
    let params: any[] = [email];
    const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);
    
    const existingCustomer = await query(`SELECT id FROM customers ${filtered.whereClause}`, filtered.params);
    if (existingCustomer.rows.length > 0) {
      throw createError('Customer with this email already exists', 400);
    }
  }

  const agencyId = req.agencyId ?? req.user?.agencyId ?? null;

  const result = await query(
    `INSERT INTO customers (
       customertype_id, salutation_id, fname, lname, company_name, cdisplay_name,
       customer_email, cwork_phone, cmobile_phone, website, gst_treatment,
       gstin_number, place_of_supply, currency_id, is_active, agency_id,
       created_by, created_date, updated_by, updated_date, custom_fields, remark
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), ?, ?)`,
    [
      1, // customertype_id - default
      1, // salutation_id - default
      fname,
      lname,
      company_name || name || '',
      name || company_name || '',
      email || '',
      phone || '',
      phone || '',
      '',  // website
      gstin ? 1 : 3, // gst_treatment: 1=registered, 3=unregistered
      gstin || '',
      21, // place_of_supply - default
      21, // currency_id - INR
      true,  // is_active
      agencyId,  // agency_id from authenticated user
      req.user?.id || 1,  // created_by
      req.user?.id || 1,  // updated_by
      '', // custom_fields
      ''  // remark
    ]
  );

  // Get the inserted customer using the insertId from MySQL
  const insertId = result.insertId;
  const customerResult = await query(
    `SELECT 
       id,
       CONCAT(fname, ' ', lname) as name,
       customer_email as email,
       COALESCE(cwork_phone, cmobile_phone) as phone,
       '' as address,
       gstin_number as gstin,
       company_name,
       created_date as created_at,
       updated_date as updated_at
     FROM customers WHERE id = ?`,
    [insertId]
  );

  logger.info('Customer created', { customerId: insertId, name });

  res.status(201).json({
    success: true,
    data: customerResult.rows[0],
    message: 'Customer created successfully'
  });
}));

// PUT /api/v1/customers/:id
router.put('/:id', authorize(['admin', 'agency']), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    name,
    email,
    phone,
    address,
    gstin,
    company_name
  } = req.body;

  // Check if customer exists — scoped to the user's agency
  let existingWhere = 'WHERE id = ?';
  let existingParams: any[] = [id];
  const existingFiltered = addAgencyFilter(existingWhere, existingParams, req.agencyId ?? null);
  const existingCustomer = await query(`SELECT id FROM customers ${existingFiltered.whereClause}`, existingFiltered.params);
  if (existingCustomer.rows.length === 0) {
    throw createError('Customer not found', 404);
  }

  // Check if email already exists for another customer
  if (email) {
    let emailWhere = 'WHERE customer_email = ? AND id != ?';
    let emailParams: any[] = [email, id];
    const emailFiltered = addAgencyFilter(emailWhere, emailParams, req.agencyId ?? null);
    const emailCheck = await query(`SELECT id FROM customers ${emailFiltered.whereClause}`, emailFiltered.params);
    if (emailCheck.rows.length > 0) {
      throw createError('Customer with this email already exists', 400);
    }
  }

  // Split name into first and last name if provided
  let fname, lname;
  if (name) {
    const nameParts = name.trim().split(' ');
    fname = nameParts[0] || '';
    lname = nameParts.slice(1).join(' ') || '';
  }

  // Build update query dynamically
  const updates: string[] = [];
  const params: any[] = [];

  if (fname !== undefined) {
    updates.push('fname = ?');
    params.push(fname);
  }
  if (lname !== undefined) {
    updates.push('lname = ?');
    params.push(lname);
  }
  if (email) {
    updates.push('customer_email = ?');
    params.push(email);
  }
  if (phone) {
    updates.push('cwork_phone = ?', 'cmobile_phone = ?');
    params.push(phone, phone);
  }
  if (gstin) {
    updates.push('gstin_number = ?');
    params.push(gstin);
  }
  if (company_name) {
    updates.push('company_name = ?', 'cdisplay_name = ?');
    params.push(company_name, company_name);
  }

  updates.push('updated_date = NOW()', 'updated_by = ?');
  params.push(req.user?.id || 1);

  params.push(id); // WHERE id = ?

  if (updates.length > 2) { // More than just updated_date and updated_by
    await query(
      `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
  }

  // Get the updated customer
  const customerResult = await query(
    `SELECT 
       id,
       CONCAT(fname, ' ', lname) as name,
       customer_email as email,
       COALESCE(cwork_phone, cmobile_phone) as phone,
       '' as address,
       gstin_number as gstin,
       company_name,
       created_date as created_at,
       updated_date as updated_at
     FROM customers WHERE id = ?`,
    [id]
  );

  logger.info('Customer updated', { customerId: id });

  res.json({
    success: true,
    data: customerResult.rows[0],
    message: 'Customer updated successfully'
  });
}));

// DELETE /api/v1/customers/:id
router.delete('/:id', authorize(['admin', 'agency']), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Check if customer exists — scoped to the user's agency to prevent cross-agency deletion
  let existingWhere = 'WHERE id = ?';
  let existingParams: any[] = [id];
  const existingFiltered = addAgencyFilter(existingWhere, existingParams, req.agencyId ?? null);
  const existingCustomer = await query(`SELECT id FROM customers ${existingFiltered.whereClause}`, existingFiltered.params);
  if (existingCustomer.rows.length === 0) {
    throw createError('Customer not found', 404);
  }

  // Check if customer has associated invoices or payments
  const invoicesCheck = await query('SELECT COUNT(*) as count FROM invoices WHERE customer_id = ?', [id]);
  const paymentsCheck = await query('SELECT COUNT(*) as count FROM payments_received WHERE customer_id = ?', [id]);

  if (parseInt(invoicesCheck.rows[0]?.count ?? 0) > 0 || parseInt(paymentsCheck.rows[0]?.count ?? 0) > 0) {
    // Soft delete — deactivate instead of hard delete
    await query('UPDATE customers SET is_active = false, updated_by = ?, updated_date = NOW() WHERE id = ?', [req.user?.id || 1, id]);
    logger.info('Customer deactivated (has associated records)', { customerId: id });

    res.json({
      success: true,
      message: 'Customer deactivated successfully (has associated invoices/payments)',
    });
  } else {
    // Hard delete if no associated records
    await query('DELETE FROM customers WHERE id = ?', [id]);
    logger.info('Customer deleted', { customerId: id });

    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  }
}));

export default router;

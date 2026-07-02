import express, { Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { agencyFilter, addAgencyFilter } from '../middleware/agencyFilter';
import { query } from '../config/database';
import { logger } from '../config/logger';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { cloudinaryUpload, uploadToCloudinary, deleteFromCloudinary, extractPublicId, FOLDERS } from '../services/cloudinaryService';

const router = express.Router();

// Apply authentication and agency filter
router.use(authenticate);
router.use(agencyFilter);

// Get all items
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, page = 1, limit = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = 'WHERE 1=1';
  let params: any[] = [];

  // Add agency filter
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);
  whereClause = filtered.whereClause;
  params = filtered.params;

  if (search) {
    whereClause += ` AND (name LIKE ? OR hsncode LIKE ? OR description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  // Note: mawebtec_lms items table doesn't have is_active column
  // Removed active filter

  // Get total count
  const countResult = await query(`SELECT COUNT(*) as count FROM items ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count);

  // Get items with mapped columns
  const itemsResult = await query(
    `SELECT 
       id,
       hsncode as hsn_code,
       name,
       description,
       unit_id,
       intra_tax as gst_rate,
       0 as purchase_price,
       selling_price,
       0 as current_stock,
       0 as min_stock_level,
       created_date,
       updated_date
     FROM items ${whereClause} 
     ORDER BY name ASC 
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );

  // Disable caching
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });

  res.json({
    success: true,
    data: itemsResult.rows,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      total,
      limit: Number(limit)
    }
  });
}));

// Get item by ID
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
       hsncode as hsn_code,
       name,
       description,
       unit_id,
       intra_tax as gst_rate,
       0 as purchase_price,
       selling_price,
       0 as current_stock,
       0 as min_stock_level,
       agency_id,
       created_date,
       updated_date
     FROM items ${whereClause}`,
    params
  );

  if (result.rows.length === 0) {
    throw createError('Item not found', 404);
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
}));

// Create item
router.post('/', authorize(['admin', 'agency']), asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    sku,
    hsn_code,
    name,
    description,
    unit,
    selling_price,
    gst_rate,
  } = req.body;

  if (!name) {
    throw createError('Item name is required', 400);
  }

  const validGstRates = [0, 5, 12, 18, 28];
  const resolvedGstRate = gst_rate !== undefined ? Number(gst_rate) : 18;
  if (!validGstRates.includes(resolvedGstRate)) {
    throw createError(`Invalid GST rate. Must be one of: ${validGstRates.join(', ')}`, 400);
  }

  const agencyId = req.agencyId ?? req.user?.agencyId ?? null;

  // Check if item already exists by name in same agency
  let whereClause = 'WHERE name = ?';
  let params: any[] = [name];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);

  const existingItem = await query(`SELECT id FROM items ${filtered.whereClause}`, filtered.params);
  if (existingItem.rows.length > 0) {
    throw createError('Item with this name already exists', 400);
  }

  const result = await query(
    `INSERT INTO items (
       itemtype_id, name, unit_id, hsncode, taxpreference_id, selling_price,
       description, intra_tax, inter_tax, reason_exempt, agency_id,
       created_by, created_date, updated_by, updated_date
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`,
    [
      1, // itemtype_id
      name,
      (() => {
        if (typeof unit === 'number') return unit;
        // Map common string unit labels to Supabase unit_id values
        const UNIT_MAP: Record<string, number> = { PCS: 1, KG: 2, G: 3, L: 4, ML: 5, M: 6, SQ: 7, BOX: 8, PACK: 9, DOZEN: 10 };
        return UNIT_MAP[String(unit).toUpperCase()] || 1;
      })(), // unit_id
      hsn_code || sku || '', // hsncode
      1, // taxpreference_id
      selling_price || 0,
      description || '',
      resolvedGstRate, // intra_tax
      resolvedGstRate, // inter_tax
      '', // reason_exempt
      agencyId,
      req.user?.id || 1, // created_by
      req.user?.id || 1  // updated_by
    ]
  );

  const insertId = result.insertId;
  const itemResult = await query(
    `SELECT 
       id,
       hsncode as hsn_code,
       name,
       description,
       unit_id,
       intra_tax as gst_rate,
       0 as purchase_price,
       selling_price,
       0 as current_stock,
       0 as min_stock_level,
       created_date,
       updated_date
     FROM items WHERE id = ?`,
    [insertId]
  );

  logger.info('Item created', { itemId: insertId, name });

  res.status(201).json({
    success: true,
    data: itemResult.rows[0],
    message: 'Item created successfully'
  });
}));

// Update item
router.put('/:id', authorize(['admin', 'agency']), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    sku,
    name,
    description,
    unit,
    selling_price
  } = req.body;

  // Check if item exists with agency filter
  let whereClause = 'WHERE id = ?';
  let params: any[] = [id];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);

  const existingItem = await query(`SELECT id FROM items ${filtered.whereClause}`, filtered.params);
  if (existingItem.rows.length === 0) {
    throw createError('Item not found', 404);
  }

  // Check if name already exists for another item
  if (name) {
    const nameCheck = await query('SELECT id FROM items WHERE name = ? AND id != ?', [name, id]);
    if (nameCheck.rows.length > 0) {
      throw createError('Item with this name already exists', 400);
    }
  }

  // Build update query
  const updates: string[] = [];
  const updateParams: any[] = [];

  if (name) {
    updates.push('name = ?');
    updateParams.push(name);
  }
  if (sku) {
    updates.push('hsncode = ?');
    updateParams.push(sku);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    updateParams.push(description);
  }
  if (unit) {
    updates.push('unit_id = ?');
    updateParams.push(unit);
  }
  if (selling_price !== undefined) {
    updates.push('selling_price = ?');
    updateParams.push(selling_price);
  }

  updates.push('updated_date = NOW()', 'updated_by = ?');
  updateParams.push(req.user?.id || 1); // updated_by
  updateParams.push(id); // WHERE id = ?

  if (updates.length > 2) {
    await query(
      `UPDATE items SET ${updates.join(', ')} WHERE id = ?`,
      updateParams
    );
  }

  const itemResult = await query(
    `SELECT 
       id,
       hsncode as hsn_code,
       name,
       description,
       unit_id,
       intra_tax as gst_rate,
       0 as purchase_price,
       selling_price,
       0 as current_stock,
       0 as min_stock_level,
       created_date,
       updated_date
     FROM items WHERE id = ?`,
    [id]
  );

  logger.info('Item updated', { itemId: id });

  res.json({
    success: true,
    data: itemResult.rows[0],
    message: 'Item updated successfully'
  });
}));

// Delete item
router.delete('/:id', authorize(['admin']), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Check if item exists with agency filter
  let whereClause = 'WHERE id = ?';
  let params: any[] = [id];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);

  const existingItem = await query(`SELECT id FROM items ${filtered.whereClause}`, filtered.params);
  if (existingItem.rows.length === 0) {
    throw createError('Item not found', 404);
  }

  // Check if item is used in invoices (invoice_items table may not exist on all deployments)
  const tableCheck = await query(`SELECT to_regclass('invoice_items') as tbl`);
  if (tableCheck.rows[0]?.tbl) {
    const invoiceCheck = await query('SELECT COUNT(*) as count FROM invoice_items WHERE item_id = ?', [id]);
    if (parseInt(invoiceCheck.rows[0].count) > 0) {
      throw createError('Cannot delete item that is used in invoices', 400);
    }
  }

  await query('DELETE FROM items WHERE id = ?', [id]);
  logger.info('Item deleted', { itemId: id });

  res.json({
    success: true,
    message: 'Item deleted successfully'
  });
}));

/**
 * Upload item image to Cloudinary
 * POST /api/items/:id/image
 */
router.post('/:id/image', cloudinaryUpload.single('image'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!req.file) throw createError('No file uploaded', 400);

  // Verify item belongs to this agency
  let whereClause = 'WHERE id = ?';
  let params: any[] = [id];
  const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);

  const existing = await query(`SELECT id, image_url FROM items ${filtered.whereClause}`, filtered.params);
  if (existing.rows.length === 0) throw createError('Item not found', 404);

  // Delete old image from Cloudinary if it exists
  const oldUrl = existing.rows[0].image_url;
  if (oldUrl) {
    const oldPublicId = extractPublicId(oldUrl);
    if (oldPublicId) await deleteFromCloudinary(oldPublicId);
  }

  // Upload new image to Cloudinary
  const result = await uploadToCloudinary(
    req.file.buffer,
    FOLDERS.items,
    `item-${id}-${Date.now()}`
  );

  const imageUrl: string = result.secure_url;

  await query('UPDATE items SET image_url = ?, updated_date = NOW() WHERE id = ?', [imageUrl, id]);

  logger.info('Item image uploaded to Cloudinary', { itemId: id });

  res.json({
    success: true,
    message: 'Item image uploaded successfully',
    data: {
      imageUrl,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    },
  });
}));

export default router;


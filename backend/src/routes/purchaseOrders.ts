import { Router, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import Joi from 'joi';
import { validate as validateBody, validateQuery } from '../utils/validation';

const router = Router();

// Validation Schemas
const purchaseOrderSchema = Joi.object({
    vendorId: Joi.number().allow(null, '').optional(),
    vendorName: Joi.string().required(),
    orderDate: Joi.string().required(),
    expectedDelivery: Joi.string().allow('', null),
    status: Joi.string().valid('draft', 'sent', 'received', 'cancelled').default('draft'),
    subtotal: Joi.number().default(0),
    taxAmount: Joi.number().default(0),
    totalAmount: Joi.number().default(0),
    notes: Joi.string().allow('', null),
});

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('', null),
});

// Helper to generate purchase order number
async function generatePurchaseOrderNumber(): Promise<string> {
    const prefix = 'PO';
    const date = new Date();
    const yearMonth = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    const result = await query(
        `SELECT po_number FROM purchase_orders
         WHERE po_number LIKE ?
         ORDER BY id DESC LIMIT 1`,
        [`${prefix}-${yearMonth}-%`]
    );

    let nextNumber = 1;
    if (result.rows && result.rows.length > 0) {
        const lastNumber = parseInt(result.rows[0].po_number.split('-').pop());
        nextNumber = lastNumber + 1;
    }

    return `${prefix}-${yearMonth}-${nextNumber.toString().padStart(4, '0')}`;
}

// Get all purchase orders
router.get('/', authenticate, validateQuery(paginationSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, search } = req.query as any;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params: any[] = [];

    if (search) {
        whereClause += ' AND (po_number LIKE ? OR vendor_name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await query(
        `SELECT COUNT(*) as total FROM purchase_orders ${whereClause}`,
        params
    );
    const total = countResult.rows.length > 0 ? (countResult.rows[0].total ?? 0) : 0;

    const result = await query(
        `SELECT * FROM purchase_orders ${whereClause} ORDER BY created_date DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
    );

    const data = result.rows.map((row: any) => ({
        id: row.id,
        poNumber: row.po_number,
        vendorId: row.vendor_id,
        vendorName: row.vendor_name,
        orderDate: row.order_date,
        expectedDelivery: row.expected_delivery,
        status: row.status,
        subtotal: row.subtotal,
        taxAmount: row.tax_amount,
        totalAmount: row.total_amount,
        notes: row.notes,
        createdAt: row.created_date,
        updatedAt: row.updated_date,
    }));

    res.json({
        success: true,
        data,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit),
        }
    });
}));

// Get single purchase order
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
        'SELECT * FROM purchase_orders WHERE id = ?',
        [id]
    );

    if (!result.rows || result.rows.length === 0) {
        throw createError('Purchase order not found', 404);
    }

    const row = result.rows[0];
    const data = {
        id: row.id,
        poNumber: row.po_number,
        vendorId: row.vendor_id,
        vendorName: row.vendor_name,
        orderDate: row.order_date,
        expectedDelivery: row.expected_delivery,
        status: row.status,
        subtotal: row.subtotal,
        taxAmount: row.tax_amount,
        totalAmount: row.total_amount,
        notes: row.notes,
        createdAt: row.created_date,
        updatedAt: row.updated_date,
    };

    res.json({
        success: true,
        data
    });
}));

// Create purchase order
router.post('/', authenticate, validateBody(purchaseOrderSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const poNumber = await generatePurchaseOrderNumber();

    const {
        vendorId,
        vendorName,
        orderDate,
        expectedDelivery,
        status,
        subtotal,
        taxAmount,
        totalAmount,
        notes,
    } = req.body;

    await query(
        `INSERT INTO purchase_orders (
            po_number, vendor_id, vendor_name, order_date,
            expected_delivery, status, subtotal, tax_amount,
            total_amount, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            poNumber, vendorId, vendorName, orderDate,
            expectedDelivery, status || 'draft', subtotal || 0, taxAmount || 0,
            totalAmount || 0, notes, userId
        ]
    );

    res.status(201).json({
        success: true,
        message: 'Purchase order created successfully',
        data: { poNumber }
    });
}));

// Update purchase order
router.put('/:id', authenticate, validateBody(purchaseOrderSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const {
        vendorId,
        vendorName,
        orderDate,
        expectedDelivery,
        status,
        subtotal,
        taxAmount,
        totalAmount,
        notes,
    } = req.body;

    const result = await query(
        `UPDATE purchase_orders SET
            vendor_id = ?, vendor_name = ?, order_date = ?,
            expected_delivery = ?, status = ?, subtotal = ?,
            tax_amount = ?, total_amount = ?, notes = ?
         WHERE id = ?`,
        [
            vendorId, vendorName, orderDate,
            expectedDelivery, status, subtotal,
            taxAmount, totalAmount, notes, id
        ]
    );

    if (result.affectedRows === 0) {
        throw createError('Purchase order not found', 404);
    }

    res.json({
        success: true,
        message: 'Purchase order updated successfully'
    });
}));

// Delete purchase order
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
        'DELETE FROM purchase_orders WHERE id = ?',
        [id]
    );

    if (result.affectedRows === 0) {
        throw createError('Purchase order not found', 404);
    }

    res.json({
        success: true,
        message: 'Purchase order deleted successfully'
    });
}));

export default router;

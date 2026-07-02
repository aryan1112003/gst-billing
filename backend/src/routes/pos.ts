import { Router, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import Joi from 'joi';
import { validate as validateBody, validateQuery } from '../utils/validation';

const router = Router();

// Validation Schemas
const posSaleSchema = Joi.object({
    customerId: Joi.number().allow(null),
    customerName: Joi.string().default('Walk-in Customer'),
    saleDate: Joi.string().required(),
    itemsJson: Joi.string().allow('', null),
    subtotal: Joi.number().required(),
    taxAmount: Joi.number().default(0),
    discount: Joi.number().default(0),
    total: Joi.number().required(),
    paymentMethod: Joi.string().valid('cash', 'card', 'upi', 'other').default('cash'),
    status: Joi.string().valid('completed', 'refunded').default('completed'),
});

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('', null),
});

// Helper to generate POS sale number
async function generateSaleNumber(): Promise<string> {
    const prefix = 'POS';
    const date = new Date();
    const yearMonth = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    const result = await query(
        `SELECT sale_number FROM pos_sales
         WHERE sale_number LIKE ?
         ORDER BY id DESC LIMIT 1`,
        [`${prefix}-${yearMonth}-%`]
    );

    let nextNumber = 1;
    if (result.rows && result.rows.length > 0) {
        const lastNumber = parseInt(result.rows[0].sale_number.split('-').pop());
        nextNumber = lastNumber + 1;
    }

    return `${prefix}-${yearMonth}-${nextNumber.toString().padStart(4, '0')}`;
}

// Get all POS sales
router.get('/', authenticate, validateQuery(paginationSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, search } = req.query as any;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params: any[] = [];

    if (search) {
        whereClause += ' AND (sale_number LIKE ? OR customer_name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await query(
        `SELECT COUNT(*) as total FROM pos_sales ${whereClause}`,
        params
    );
    const total = countResult.rows.length > 0 ? (countResult.rows[0].total ?? 0) : 0;

    const result = await query(
        `SELECT * FROM pos_sales ${whereClause} ORDER BY created_date DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
    );

    const data = result.rows.map((row: any) => ({
        id: row.id,
        saleNumber: row.sale_number,
        customerId: row.customer_id,
        customerName: row.customer_name,
        saleDate: row.sale_date,
        itemsJson: row.items_json,
        subtotal: row.subtotal,
        taxAmount: row.tax_amount,
        discount: row.discount,
        total: row.total,
        paymentMethod: row.payment_method,
        status: row.status,
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

// Get single POS sale
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
        'SELECT * FROM pos_sales WHERE id = ?',
        [id]
    );

    if (!result.rows || result.rows.length === 0) {
        throw createError('POS sale not found', 404);
    }

    const row = result.rows[0];
    const data = {
        id: row.id,
        saleNumber: row.sale_number,
        customerId: row.customer_id,
        customerName: row.customer_name,
        saleDate: row.sale_date,
        itemsJson: row.items_json,
        subtotal: row.subtotal,
        taxAmount: row.tax_amount,
        discount: row.discount,
        total: row.total,
        paymentMethod: row.payment_method,
        status: row.status,
        createdAt: row.created_date,
        updatedAt: row.updated_date,
    };

    res.json({
        success: true,
        data
    });
}));

// Create POS sale
router.post('/', authenticate, validateBody(posSaleSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const saleNumber = await generateSaleNumber();

    const {
        customerId,
        customerName,
        saleDate,
        itemsJson,
        subtotal,
        taxAmount,
        discount,
        total,
        paymentMethod,
        status,
    } = req.body;

    const result = await query(
        `INSERT INTO pos_sales (
            sale_number, customer_id, customer_name, sale_date,
            items_json, subtotal, tax_amount, discount,
            total, payment_method, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            saleNumber, customerId, customerName || 'Walk-in Customer', saleDate,
            itemsJson, subtotal, taxAmount || 0, discount || 0,
            total, paymentMethod || 'cash', status || 'completed', userId
        ]
    );

    res.status(201).json({
        success: true,
        message: 'POS sale created successfully',
        data: { id: result.insertId, saleNumber }
    });
}));

// Update POS sale
router.put('/:id', authenticate, validateBody(posSaleSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const {
        customerId,
        customerName,
        saleDate,
        itemsJson,
        subtotal,
        taxAmount,
        discount,
        total,
        paymentMethod,
        status,
    } = req.body;

    const result = await query(
        `UPDATE pos_sales SET
            customer_id = ?, customer_name = ?, sale_date = ?,
            items_json = ?, subtotal = ?, tax_amount = ?,
            discount = ?, total = ?, payment_method = ?, status = ?
         WHERE id = ?`,
        [
            customerId, customerName, saleDate,
            itemsJson, subtotal, taxAmount,
            discount, total, paymentMethod, status, id
        ]
    );

    if (result.affectedRows === 0) {
        throw createError('POS sale not found', 404);
    }

    res.json({
        success: true,
        message: 'POS sale updated successfully'
    });
}));

// Delete POS sale
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
        'DELETE FROM pos_sales WHERE id = ?',
        [id]
    );

    if (result.affectedRows === 0) {
        throw createError('POS sale not found', 404);
    }

    res.json({
        success: true,
        message: 'POS sale deleted successfully'
    });
}));

export default router;

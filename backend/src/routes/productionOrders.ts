import { Router, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import Joi from 'joi';
import { validate as validateBody, validateQuery } from '../utils/validation';

const router = Router();

// Validation Schemas
const productionOrderSchema = Joi.object({
    productName: Joi.string().required(),
    itemId: Joi.number().allow(null),
    quantity: Joi.number().required(),
    unit: Joi.string().default('pcs'),
    plannedDate: Joi.string().required(),
    completionDate: Joi.string().allow('', null),
    status: Joi.string().valid('planned', 'in-progress', 'completed', 'cancelled').default('planned'),
    notes: Joi.string().allow('', null),
});

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('', null),
});

// Helper to generate production order number
async function generateProductionOrderNumber(): Promise<string> {
    const prefix = 'PRD';
    const date = new Date();
    const yearMonth = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    const result = await query(
        `SELECT order_number FROM production_orders
         WHERE order_number LIKE ?
         ORDER BY id DESC LIMIT 1`,
        [`${prefix}-${yearMonth}-%`]
    );

    let nextNumber = 1;
    if (result.rows && result.rows.length > 0) {
        const lastNumber = parseInt(result.rows[0].order_number.split('-').pop());
        nextNumber = lastNumber + 1;
    }

    return `${prefix}-${yearMonth}-${nextNumber.toString().padStart(4, '0')}`;
}

// Get all production orders
router.get('/', authenticate, validateQuery(paginationSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, search } = req.query as any;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params: any[] = [];

    if (search) {
        whereClause += ' AND (order_number LIKE ? OR product_name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await query(
        `SELECT COUNT(*) as total FROM production_orders ${whereClause}`,
        params
    );
    const total = countResult.rows.length > 0 ? (countResult.rows[0].total ?? 0) : 0;

    const result = await query(
        `SELECT * FROM production_orders ${whereClause} ORDER BY created_date DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
    );

    const data = result.rows.map((row: any) => ({
        id: row.id,
        orderNumber: row.order_number,
        productName: row.product_name,
        itemId: row.item_id,
        quantity: row.quantity,
        unit: row.unit,
        plannedDate: row.planned_date,
        completionDate: row.completion_date,
        status: row.status,
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

// Get single production order
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
        'SELECT * FROM production_orders WHERE id = ?',
        [id]
    );

    if (!result.rows || result.rows.length === 0) {
        throw createError('Production order not found', 404);
    }

    const row = result.rows[0];
    const data = {
        id: row.id,
        orderNumber: row.order_number,
        productName: row.product_name,
        itemId: row.item_id,
        quantity: row.quantity,
        unit: row.unit,
        plannedDate: row.planned_date,
        completionDate: row.completion_date,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_date,
        updatedAt: row.updated_date,
    };

    res.json({
        success: true,
        data
    });
}));

// Create production order
router.post('/', authenticate, validateBody(productionOrderSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const orderNumber = await generateProductionOrderNumber();

    const {
        productName,
        itemId,
        quantity,
        unit,
        plannedDate,
        completionDate,
        status,
        notes,
    } = req.body;

    await query(
        `INSERT INTO production_orders (
            order_number, product_name, item_id, quantity,
            unit, planned_date, completion_date, status,
            notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            orderNumber, productName, itemId, quantity,
            unit || 'pcs', plannedDate, completionDate, status || 'planned',
            notes, userId
        ]
    );

    res.status(201).json({
        success: true,
        message: 'Production order created successfully',
        data: { orderNumber }
    });
}));

// Update production order
router.put('/:id', authenticate, validateBody(productionOrderSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const {
        productName,
        itemId,
        quantity,
        unit,
        plannedDate,
        completionDate,
        status,
        notes,
    } = req.body;

    const result = await query(
        `UPDATE production_orders SET
            product_name = ?, item_id = ?, quantity = ?,
            unit = ?, planned_date = ?, completion_date = ?,
            status = ?, notes = ?
         WHERE id = ?`,
        [
            productName, itemId, quantity,
            unit, plannedDate, completionDate,
            status, notes, id
        ]
    );

    if (result.affectedRows === 0) {
        throw createError('Production order not found', 404);
    }

    res.json({
        success: true,
        message: 'Production order updated successfully'
    });
}));

// Delete production order
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
        'DELETE FROM production_orders WHERE id = ?',
        [id]
    );

    if (result.affectedRows === 0) {
        throw createError('Production order not found', 404);
    }

    res.json({
        success: true,
        message: 'Production order deleted successfully'
    });
}));

export default router;

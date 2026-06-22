import { Router, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import Joi from 'joi';
import { validate as validateBody, validateQuery } from '../utils/validation';

const router = Router();

// Validation Schemas
const batchSchema = Joi.object({
    batchNumber: Joi.string().required(),
    itemId: Joi.number().allow(null),
    itemName: Joi.string().required(),
    manufacturingDate: Joi.string().allow('', null),
    expiryDate: Joi.string().required(),
    quantity: Joi.number().required(),
    unit: Joi.string().default('pcs'),
    supplierName: Joi.string().allow('', null),
    purchaseRate: Joi.number().default(0),
    status: Joi.string().valid('active', 'expired', 'recalled', 'consumed').default('active'),
});

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('', null),
});

// Get all batches
router.get('/', authenticate, validateQuery(paginationSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, search } = req.query as any;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params: any[] = [];

    if (search) {
        whereClause += ' AND (batch_number LIKE ? OR item_name LIKE ? OR supplier_name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countResult = await query(
        `SELECT COUNT(*) as total FROM batches ${whereClause}`,
        params
    );
    const total = countResult.rows.length > 0 ? (countResult.rows[0].total ?? 0) : 0;

    const result = await query(
        `SELECT * FROM batches ${whereClause} ORDER BY created_date DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
    );

    const data = result.rows.map((row: any) => ({
        id: row.id,
        batchNumber: row.batch_number,
        itemId: row.item_id,
        itemName: row.item_name,
        manufacturingDate: row.manufacturing_date,
        expiryDate: row.expiry_date,
        quantity: row.quantity,
        unit: row.unit,
        supplierName: row.supplier_name,
        purchaseRate: row.purchase_rate,
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

// Get single batch
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
        'SELECT * FROM batches WHERE id = ?',
        [id]
    );

    if (!result.rows || result.rows.length === 0) {
        throw createError('Batch not found', 404);
    }

    const row = result.rows[0];
    const data = {
        id: row.id,
        batchNumber: row.batch_number,
        itemId: row.item_id,
        itemName: row.item_name,
        manufacturingDate: row.manufacturing_date,
        expiryDate: row.expiry_date,
        quantity: row.quantity,
        unit: row.unit,
        supplierName: row.supplier_name,
        purchaseRate: row.purchase_rate,
        status: row.status,
        createdAt: row.created_date,
        updatedAt: row.updated_date,
    };

    res.json({
        success: true,
        data
    });
}));

// Create batch
router.post('/', authenticate, validateBody(batchSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const {
        batchNumber,
        itemId,
        itemName,
        manufacturingDate,
        expiryDate,
        quantity,
        unit,
        supplierName,
        purchaseRate,
        status,
    } = req.body;

    await query(
        `INSERT INTO batches (
            batch_number, item_id, item_name, manufacturing_date,
            expiry_date, quantity, unit, supplier_name,
            purchase_rate, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            batchNumber, itemId, itemName, manufacturingDate,
            expiryDate, quantity, unit || 'pcs', supplierName,
            purchaseRate || 0, status || 'active', userId
        ]
    );

    res.status(201).json({
        success: true,
        message: 'Batch created successfully',
        data: { batchNumber }
    });
}));

// Update batch
router.put('/:id', authenticate, validateBody(batchSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const {
        batchNumber,
        itemId,
        itemName,
        manufacturingDate,
        expiryDate,
        quantity,
        unit,
        supplierName,
        purchaseRate,
        status,
    } = req.body;

    const result = await query(
        `UPDATE batches SET
            batch_number = ?, item_id = ?, item_name = ?,
            manufacturing_date = ?, expiry_date = ?, quantity = ?,
            unit = ?, supplier_name = ?, purchase_rate = ?, status = ?
         WHERE id = ?`,
        [
            batchNumber, itemId, itemName,
            manufacturingDate, expiryDate, quantity,
            unit, supplierName, purchaseRate, status, id
        ]
    );

    if (result.affectedRows === 0) {
        throw createError('Batch not found', 404);
    }

    res.json({
        success: true,
        message: 'Batch updated successfully'
    });
}));

// Delete batch
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
        'DELETE FROM batches WHERE id = ?',
        [id]
    );

    if (result.affectedRows === 0) {
        throw createError('Batch not found', 404);
    }

    res.json({
        success: true,
        message: 'Batch deleted successfully'
    });
}));

export default router;

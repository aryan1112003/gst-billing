import { Router, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import Joi from 'joi';
import { validate as validateBody, validateQuery } from '../utils/validation';

const router = Router();

// Validation Schemas
const bomSchema = Joi.object({
    productName: Joi.string().required(),
    itemId: Joi.number().allow(null),
    quantity: Joi.number().required(),
    unit: Joi.string().default('pcs'),
    status: Joi.string().valid('active', 'inactive').default('active'),
    components: Joi.array().items(
        Joi.object({
            componentName: Joi.string().required(),
            itemId: Joi.number().allow(null),
            quantity: Joi.number().required(),
            unit: Joi.string().required(),
        })
    ).optional(),
});

const bomUpdateSchema = Joi.object({
    productName: Joi.string(),
    itemId: Joi.number().allow(null),
    quantity: Joi.number(),
    unit: Joi.string(),
    status: Joi.string().valid('active', 'inactive'),
    components: Joi.array().items(
        Joi.object({
            componentName: Joi.string().required(),
            itemId: Joi.number().allow(null),
            quantity: Joi.number().required(),
            unit: Joi.string().required(),
        })
    ).optional(),
});

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('', null),
});

// Helper to generate BOM number
async function generateBomNumber(): Promise<string> {
    const prefix = 'BOM';
    const date = new Date();
    const yearMonth = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    const result = await query(
        `SELECT bom_number FROM bom_headers
         WHERE bom_number LIKE ?
         ORDER BY id DESC LIMIT 1`,
        [`${prefix}-${yearMonth}-%`]
    );

    let nextNumber = 1;
    if (result.rows && result.rows.length > 0) {
        const lastNumber = parseInt(result.rows[0].bom_number.split('-').pop());
        nextNumber = lastNumber + 1;
    }

    return `${prefix}-${yearMonth}-${nextNumber.toString().padStart(4, '0')}`;
}

// Get all BOMs
router.get('/', authenticate, validateQuery(paginationSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, search } = req.query as any;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params: any[] = [];

    if (search) {
        whereClause += ' AND (bom_number LIKE ? OR product_name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await query(
        `SELECT COUNT(*) as total FROM bom_headers ${whereClause}`,
        params
    );
    const total = countResult.rows.length > 0 ? (countResult.rows[0].total ?? 0) : 0;

    const result = await query(
        `SELECT * FROM bom_headers ${whereClause} ORDER BY created_date DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
    );

    const data = await Promise.all(result.rows.map(async (row: any) => {
        const itemsResult = await query(
            'SELECT * FROM bom_items WHERE bom_id = ?',
            [row.id]
        );
        const components = itemsResult.rows.map((item: any) => ({
            id: item.id,
            componentName: item.component_name,
            itemId: item.item_id,
            quantity: item.quantity,
            unit: item.unit,
        }));
        return {
            id: row.id,
            bomNumber: row.bom_number,
            productName: row.product_name,
            itemId: row.item_id,
            quantity: row.quantity,
            unit: row.unit,
            status: row.status,
            components,
            createdAt: row.created_date,
            updatedAt: row.updated_date,
        };
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

// Get single BOM
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
        'SELECT * FROM bom_headers WHERE id = ?',
        [id]
    );

    if (!result.rows || result.rows.length === 0) {
        throw createError('Bill of materials not found', 404);
    }

    const row = result.rows[0];

    const itemsResult = await query(
        'SELECT * FROM bom_items WHERE bom_id = ?',
        [row.id]
    );
    const components = itemsResult.rows.map((item: any) => ({
        id: item.id,
        componentName: item.component_name,
        itemId: item.item_id,
        quantity: item.quantity,
        unit: item.unit,
    }));

    const data = {
        id: row.id,
        bomNumber: row.bom_number,
        productName: row.product_name,
        itemId: row.item_id,
        quantity: row.quantity,
        unit: row.unit,
        status: row.status,
        components,
        createdAt: row.created_date,
        updatedAt: row.updated_date,
    };

    res.json({
        success: true,
        data
    });
}));

// Create BOM
router.post('/', authenticate, validateBody(bomSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const bomNumber = await generateBomNumber();

    const {
        productName,
        itemId,
        quantity,
        unit,
        status,
        components,
    } = req.body;

    const insertResult = await query(
        `INSERT INTO bom_headers (
            bom_number, product_name, item_id, quantity,
            unit, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [bomNumber, productName, itemId, quantity, unit || 'pcs', status || 'active', userId]
    );

    const bomId = insertResult.insertId;

    if (components && components.length > 0) {
        for (const component of components) {
            await query(
                `INSERT INTO bom_items (bom_id, component_name, item_id, quantity, unit)
                 VALUES (?, ?, ?, ?, ?)`,
                [bomId, component.componentName, component.itemId, component.quantity, component.unit]
            );
        }
    }

    res.status(201).json({
        success: true,
        message: 'Bill of materials created successfully',
        data: { id: bomId, bomNumber }
    });
}));

// Update BOM
router.put('/:id', authenticate, validateBody(bomUpdateSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const {
        productName,
        itemId,
        quantity,
        unit,
        status,
        components,
    } = req.body;

    const result = await query(
        `UPDATE bom_headers SET
            product_name = ?, item_id = ?, quantity = ?,
            unit = ?, status = ?
         WHERE id = ?`,
        [productName, itemId, quantity, unit, status, id]
    );

    if (result.affectedRows === 0) {
        throw createError('Bill of materials not found', 404);
    }

    if (components !== undefined) {
        await query('DELETE FROM bom_items WHERE bom_id = ?', [id]);
        if (components && components.length > 0) {
            for (const component of components) {
                await query(
                    `INSERT INTO bom_items (bom_id, component_name, item_id, quantity, unit)
                     VALUES (?, ?, ?, ?, ?)`,
                    [id, component.componentName, component.itemId, component.quantity, component.unit]
                );
            }
        }
    }

    res.json({
        success: true,
        message: 'Bill of materials updated successfully'
    });
}));

// Delete BOM
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    await query('DELETE FROM bom_items WHERE bom_id = ?', [id]);

    const result = await query(
        'DELETE FROM bom_headers WHERE id = ?',
        [id]
    );

    if (result.affectedRows === 0) {
        throw createError('Bill of materials not found', 404);
    }

    res.json({
        success: true,
        message: 'Bill of materials deleted successfully'
    });
}));

export default router;

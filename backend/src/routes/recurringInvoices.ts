import { Router, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import Joi from 'joi';
import { validate as validateBody, validateQuery } from '../utils/validation';

const router = Router();

// Validation Schemas
const recurringInvoiceSchema = Joi.object({
    customerId: Joi.number().allow(null),
    customerName: Joi.string().required(),
    frequency: Joi.string().valid('weekly', 'monthly', 'quarterly', 'yearly').required(),
    nextDate: Joi.string().required(),
    endDate: Joi.string().allow('', null),
    amount: Joi.number().required(),
    taxRate: Joi.number().default(0),
    description: Joi.string().allow('', null),
    status: Joi.string().valid('active', 'paused', 'completed').default('active'),
});

const recurringInvoiceUpdateSchema = Joi.object({
    customerId: Joi.number().allow(null),
    customerName: Joi.string(),
    frequency: Joi.string().valid('weekly', 'monthly', 'quarterly', 'yearly'),
    nextDate: Joi.string(),
    endDate: Joi.string().allow('', null),
    amount: Joi.number(),
    taxRate: Joi.number(),
    description: Joi.string().allow('', null),
    status: Joi.string().valid('active', 'paused', 'completed'),
});

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('', null),
});

// Helper to generate recurring invoice number
async function generateRecurringNumber(): Promise<string> {
    const prefix = 'REC';
    const date = new Date();
    const yearMonth = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    const result = await query(
        `SELECT recurring_number FROM recurring_invoices
         WHERE recurring_number LIKE ?
         ORDER BY id DESC LIMIT 1`,
        [`${prefix}-${yearMonth}-%`]
    );

    let nextNumber = 1;
    if (result.rows && result.rows.length > 0) {
        const lastNumber = parseInt(result.rows[0].recurring_number.split('-').pop());
        nextNumber = lastNumber + 1;
    }

    return `${prefix}-${yearMonth}-${nextNumber.toString().padStart(4, '0')}`;
}

// Get all recurring invoices
router.get('/', authenticate, validateQuery(paginationSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, search } = req.query as any;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params: any[] = [];

    if (search) {
        whereClause += ' AND (recurring_number LIKE ? OR customer_name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await query(
        `SELECT COUNT(*) as total FROM recurring_invoices ${whereClause}`,
        params
    );
    const total = countResult.rows.length > 0 ? (countResult.rows[0].total ?? 0) : 0;

    const result = await query(
        `SELECT * FROM recurring_invoices ${whereClause} ORDER BY created_date DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
    );

    const data = result.rows.map((row: any) => ({
        id: row.id,
        recurringNumber: row.recurring_number,
        customerId: row.customer_id,
        customerName: row.customer_name,
        frequency: row.frequency,
        nextDate: row.next_date,
        endDate: row.end_date,
        amount: row.amount,
        taxRate: row.tax_rate,
        description: row.description,
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

// Get single recurring invoice
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
        'SELECT * FROM recurring_invoices WHERE id = ?',
        [id]
    );

    if (!result.rows || result.rows.length === 0) {
        throw createError('Recurring invoice not found', 404);
    }

    const row = result.rows[0];
    const data = {
        id: row.id,
        recurringNumber: row.recurring_number,
        customerId: row.customer_id,
        customerName: row.customer_name,
        frequency: row.frequency,
        nextDate: row.next_date,
        endDate: row.end_date,
        amount: row.amount,
        taxRate: row.tax_rate,
        description: row.description,
        status: row.status,
        createdAt: row.created_date,
        updatedAt: row.updated_date,
    };

    res.json({
        success: true,
        data
    });
}));

// Create recurring invoice
router.post('/', authenticate, validateBody(recurringInvoiceSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const recurringNumber = await generateRecurringNumber();

    const {
        customerId,
        customerName,
        frequency,
        nextDate,
        endDate,
        amount,
        taxRate,
        description,
        status,
    } = req.body;

    const result = await query(
        `INSERT INTO recurring_invoices (
            recurring_number, customer_id, customer_name, frequency,
            next_date, end_date, amount, tax_rate,
            description, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            recurringNumber, customerId, customerName, frequency,
            nextDate, endDate, amount, taxRate || 0,
            description, status || 'active', userId
        ]
    );

    res.status(201).json({
        success: true,
        message: 'Recurring invoice created successfully',
        data: { id: result.insertId, recurringNumber }
    });
}));

// Update recurring invoice
router.put('/:id', authenticate, validateBody(recurringInvoiceUpdateSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const {
        customerId,
        customerName,
        frequency,
        nextDate,
        endDate,
        amount,
        taxRate,
        description,
        status,
    } = req.body;

    const fields: string[] = [];
    const vals: any[] = [];
    if (customerId !== undefined) { fields.push('customer_id = ?'); vals.push(customerId); }
    if (customerName !== undefined) { fields.push('customer_name = ?'); vals.push(customerName); }
    if (frequency !== undefined) { fields.push('frequency = ?'); vals.push(frequency); }
    if (nextDate !== undefined) { fields.push('next_date = ?'); vals.push(nextDate); }
    if (endDate !== undefined) { fields.push('end_date = ?'); vals.push(endDate); }
    if (amount !== undefined) { fields.push('amount = ?'); vals.push(amount); }
    if (taxRate !== undefined) { fields.push('tax_rate = ?'); vals.push(taxRate); }
    if (description !== undefined) { fields.push('description = ?'); vals.push(description); }
    if (status !== undefined) { fields.push('status = ?'); vals.push(status); }
    if (fields.length === 0) throw createError('No fields to update', 400);

    const result = await query(
        `UPDATE recurring_invoices SET ${fields.join(', ')} WHERE id = ?`,
        [...vals, id]
    );

    if (result.affectedRows === 0) {
        throw createError('Recurring invoice not found', 404);
    }

    res.json({
        success: true,
        message: 'Recurring invoice updated successfully'
    });
}));

// Delete recurring invoice
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
        'DELETE FROM recurring_invoices WHERE id = ?',
        [id]
    );

    if (result.affectedRows === 0) {
        throw createError('Recurring invoice not found', 404);
    }

    res.json({
        success: true,
        message: 'Recurring invoice deleted successfully'
    });
}));

export default router;

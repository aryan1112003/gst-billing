import { Router, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import Joi from 'joi';
import { validate as validateBody, validateQuery } from '../utils/validation';

const router = Router();

// Validation Schemas
const timeEntrySchema = Joi.object({
    customerId: Joi.number().allow(null),
    customerName: Joi.string().allow('', null),
    projectName: Joi.string().required(),
    workDate: Joi.string().required(),
    hours: Joi.number().required(),
    description: Joi.string().allow('', null),
    billable: Joi.number().default(1),
    billed: Joi.number().default(0),
    hourlyRate: Joi.number().default(0),
});

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('', null),
});

// Helper to generate time entry number
async function generateEntryNumber(): Promise<string> {
    const prefix = 'TE';
    const date = new Date();
    const yearMonth = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    const result = await query(
        `SELECT entry_number FROM time_entries
         WHERE entry_number LIKE ?
         ORDER BY id DESC LIMIT 1`,
        [`${prefix}-${yearMonth}-%`]
    );

    let nextNumber = 1;
    if (result.rows && result.rows.length > 0) {
        const lastNumber = parseInt(result.rows[0].entry_number.split('-').pop());
        nextNumber = lastNumber + 1;
    }

    return `${prefix}-${yearMonth}-${nextNumber.toString().padStart(4, '0')}`;
}

// Get all time entries
router.get('/', authenticate, validateQuery(paginationSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, search } = req.query as any;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params: any[] = [];

    if (search) {
        whereClause += ' AND (entry_number LIKE ? OR customer_name LIKE ? OR project_name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countResult = await query(
        `SELECT COUNT(*) as total FROM time_entries ${whereClause}`,
        params
    );
    const total = countResult.rows.length > 0 ? (countResult.rows[0].total ?? 0) : 0;

    const result = await query(
        `SELECT * FROM time_entries ${whereClause} ORDER BY created_date DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
    );

    const data = result.rows.map((row: any) => ({
        id: row.id,
        entryNumber: row.entry_number,
        customerId: row.customer_id,
        customerName: row.customer_name,
        projectName: row.project_name,
        workDate: row.work_date,
        hours: row.hours,
        description: row.description,
        billable: row.billable,
        billed: row.billed,
        hourlyRate: row.hourly_rate,
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

// Get single time entry
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
        'SELECT * FROM time_entries WHERE id = ?',
        [id]
    );

    if (!result.rows || result.rows.length === 0) {
        throw createError('Time entry not found', 404);
    }

    const row = result.rows[0];
    const data = {
        id: row.id,
        entryNumber: row.entry_number,
        customerId: row.customer_id,
        customerName: row.customer_name,
        projectName: row.project_name,
        workDate: row.work_date,
        hours: row.hours,
        description: row.description,
        billable: row.billable,
        billed: row.billed,
        hourlyRate: row.hourly_rate,
        createdAt: row.created_date,
        updatedAt: row.updated_date,
    };

    res.json({
        success: true,
        data
    });
}));

// Create time entry
router.post('/', authenticate, validateBody(timeEntrySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const entryNumber = await generateEntryNumber();

    const {
        customerId,
        customerName,
        projectName,
        workDate,
        hours,
        description,
        billable,
        billed,
        hourlyRate,
    } = req.body;

    const result = await query(
        `INSERT INTO time_entries (
            entry_number, customer_id, customer_name, project_name,
            work_date, hours, description, billable,
            billed, hourly_rate, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            entryNumber, customerId, customerName, projectName,
            workDate, hours, description, billable !== undefined ? billable : 1,
            billed !== undefined ? billed : 0, hourlyRate || 0, userId
        ]
    );

    res.status(201).json({
        success: true,
        message: 'Time entry created successfully',
        data: { id: result.insertId, entryNumber }
    });
}));

// Update time entry
router.put('/:id', authenticate, validateBody(timeEntrySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const {
        customerId,
        customerName,
        projectName,
        workDate,
        hours,
        description,
        billable,
        billed,
        hourlyRate,
    } = req.body;

    const result = await query(
        `UPDATE time_entries SET
            customer_id = ?, customer_name = ?, project_name = ?,
            work_date = ?, hours = ?, description = ?,
            billable = ?, billed = ?, hourly_rate = ?
         WHERE id = ?`,
        [
            customerId, customerName, projectName,
            workDate, hours, description,
            billable, billed, hourlyRate, id
        ]
    );

    if (result.affectedRows === 0) {
        throw createError('Time entry not found', 404);
    }

    res.json({
        success: true,
        message: 'Time entry updated successfully'
    });
}));

// Delete time entry
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
        'DELETE FROM time_entries WHERE id = ?',
        [id]
    );

    if (result.affectedRows === 0) {
        throw createError('Time entry not found', 404);
    }

    res.json({
        success: true,
        message: 'Time entry deleted successfully'
    });
}));

export default router;

import { Router, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import Joi from 'joi';
import { validate as validateBody, validateQuery } from '../utils/validation';

const router = Router();

// Validation Schemas
const projectSchema = Joi.object({
    projectName: Joi.string().required(),
    customerId: Joi.number().allow(null),
    customerName: Joi.string().allow('', null),
    startDate: Joi.string().required(),
    endDate: Joi.string().allow('', null),
    budget: Joi.number().default(0),
    billedAmount: Joi.number().default(0),
    status: Joi.string().valid('planning', 'active', 'on-hold', 'completed', 'cancelled').default('planning'),
    description: Joi.string().allow('', null),
});

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('', null),
});

// Helper to generate project number
async function generateProjectNumber(): Promise<string> {
    const prefix = 'PRJ';
    const date = new Date();
    const yearMonth = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    const result = await query(
        `SELECT project_number FROM projects
         WHERE project_number LIKE ?
         ORDER BY id DESC LIMIT 1`,
        [`${prefix}-${yearMonth}-%`]
    );

    let nextNumber = 1;
    if (result.rows && result.rows.length > 0) {
        const lastNumber = parseInt(result.rows[0].project_number.split('-').pop());
        nextNumber = lastNumber + 1;
    }

    return `${prefix}-${yearMonth}-${nextNumber.toString().padStart(4, '0')}`;
}

// Get all projects
router.get('/', authenticate, validateQuery(paginationSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, search } = req.query as any;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params: any[] = [];

    if (search) {
        whereClause += ' AND (project_number LIKE ? OR project_name LIKE ? OR customer_name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countResult = await query(
        `SELECT COUNT(*) as total FROM projects ${whereClause}`,
        params
    );
    const total = countResult.rows.length > 0 ? (countResult.rows[0].total ?? 0) : 0;

    const result = await query(
        `SELECT * FROM projects ${whereClause} ORDER BY created_date DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
    );

    const data = result.rows.map((row: any) => ({
        id: row.id,
        projectNumber: row.project_number,
        projectName: row.project_name,
        customerId: row.customer_id,
        customerName: row.customer_name,
        startDate: row.start_date,
        endDate: row.end_date,
        budget: row.budget,
        billedAmount: row.billed_amount,
        status: row.status,
        description: row.description,
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

// Get single project
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
        'SELECT * FROM projects WHERE id = ?',
        [id]
    );

    if (!result.rows || result.rows.length === 0) {
        throw createError('Project not found', 404);
    }

    const row = result.rows[0];
    const data = {
        id: row.id,
        projectNumber: row.project_number,
        projectName: row.project_name,
        customerId: row.customer_id,
        customerName: row.customer_name,
        startDate: row.start_date,
        endDate: row.end_date,
        budget: row.budget,
        billedAmount: row.billed_amount,
        status: row.status,
        description: row.description,
        createdAt: row.created_date,
        updatedAt: row.updated_date,
    };

    res.json({
        success: true,
        data
    });
}));

// Create project
router.post('/', authenticate, validateBody(projectSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const projectNumber = await generateProjectNumber();

    const {
        projectName,
        customerId,
        customerName,
        startDate,
        endDate,
        budget,
        billedAmount,
        status,
        description,
    } = req.body;

    await query(
        `INSERT INTO projects (
            project_number, project_name, customer_id, customer_name,
            start_date, end_date, budget, billed_amount,
            status, description, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            projectNumber, projectName, customerId, customerName,
            startDate, endDate, budget || 0, billedAmount || 0,
            status || 'planning', description, userId
        ]
    );

    res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: { projectNumber }
    });
}));

// Update project
router.put('/:id', authenticate, validateBody(projectSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const {
        projectName,
        customerId,
        customerName,
        startDate,
        endDate,
        budget,
        billedAmount,
        status,
        description,
    } = req.body;

    const result = await query(
        `UPDATE projects SET
            project_name = ?, customer_id = ?, customer_name = ?,
            start_date = ?, end_date = ?, budget = ?,
            billed_amount = ?, status = ?, description = ?
         WHERE id = ?`,
        [
            projectName, customerId, customerName,
            startDate, endDate, budget,
            billedAmount, status, description, id
        ]
    );

    if (result.affectedRows === 0) {
        throw createError('Project not found', 404);
    }

    res.json({
        success: true,
        message: 'Project updated successfully'
    });
}));

// Delete project
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
        'DELETE FROM projects WHERE id = ?',
        [id]
    );

    if (result.affectedRows === 0) {
        throw createError('Project not found', 404);
    }

    res.json({
        success: true,
        message: 'Project deleted successfully'
    });
}));

export default router;

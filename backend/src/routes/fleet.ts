import { Router, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import Joi from 'joi';
import { validate as validateBody, validateQuery } from '../utils/validation';

const router = Router();

// Validation Schemas
const vehicleSchema = Joi.object({
    vehicleNumber: Joi.string().required(),
    vehicleType: Joi.string().required(),
    make: Joi.string().required(),
    model: Joi.string().required(),
    year: Joi.number().allow(null),
    color: Joi.string().allow('', null),
    registrationDate: Joi.string().allow('', null),
    insuranceExpiry: Joi.string().allow('', null),
    fitnessExpiry: Joi.string().allow('', null),
    rcNumber: Joi.string().allow('', null),
    status: Joi.string().valid('active', 'inactive', 'under-maintenance').default('active'),
});

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('', null),
});

// Get all vehicles
router.get('/', authenticate, validateQuery(paginationSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, search } = req.query as any;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params: any[] = [];

    if (search) {
        whereClause += ' AND (vehicle_number LIKE ? OR make LIKE ? OR model LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countResult = await query(
        `SELECT COUNT(*) as total FROM vehicles ${whereClause}`,
        params
    );
    const total = countResult.rows.length > 0 ? (countResult.rows[0].total ?? 0) : 0;

    const result = await query(
        `SELECT * FROM vehicles ${whereClause} ORDER BY created_date DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
    );

    const data = result.rows.map((row: any) => ({
        id: row.id,
        vehicleNumber: row.vehicle_number,
        vehicleType: row.vehicle_type,
        make: row.make,
        model: row.model,
        year: row.year,
        color: row.color,
        registrationDate: row.registration_date,
        insuranceExpiry: row.insurance_expiry,
        fitnessExpiry: row.fitness_expiry,
        rcNumber: row.rc_number,
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

// Get single vehicle
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
        'SELECT * FROM vehicles WHERE id = ?',
        [id]
    );

    if (!result.rows || result.rows.length === 0) {
        throw createError('Vehicle not found', 404);
    }

    const row = result.rows[0];
    const data = {
        id: row.id,
        vehicleNumber: row.vehicle_number,
        vehicleType: row.vehicle_type,
        make: row.make,
        model: row.model,
        year: row.year,
        color: row.color,
        registrationDate: row.registration_date,
        insuranceExpiry: row.insurance_expiry,
        fitnessExpiry: row.fitness_expiry,
        rcNumber: row.rc_number,
        status: row.status,
        createdAt: row.created_date,
        updatedAt: row.updated_date,
    };

    res.json({
        success: true,
        data
    });
}));

// Create vehicle
router.post('/', authenticate, validateBody(vehicleSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const {
        vehicleNumber,
        vehicleType,
        make,
        model,
        year,
        color,
        registrationDate,
        insuranceExpiry,
        fitnessExpiry,
        rcNumber,
        status,
    } = req.body;

    await query(
        `INSERT INTO vehicles (
            vehicle_number, vehicle_type, make, model,
            year, color, registration_date, insurance_expiry,
            fitness_expiry, rc_number, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            vehicleNumber, vehicleType, make, model,
            year, color, registrationDate, insuranceExpiry,
            fitnessExpiry, rcNumber, status || 'active', userId
        ]
    );

    res.status(201).json({
        success: true,
        message: 'Vehicle created successfully',
        data: { vehicleNumber }
    });
}));

// Update vehicle
router.put('/:id', authenticate, validateBody(vehicleSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const {
        vehicleNumber,
        vehicleType,
        make,
        model,
        year,
        color,
        registrationDate,
        insuranceExpiry,
        fitnessExpiry,
        rcNumber,
        status,
    } = req.body;

    const result = await query(
        `UPDATE vehicles SET
            vehicle_number = ?, vehicle_type = ?, make = ?, model = ?,
            year = ?, color = ?, registration_date = ?, insurance_expiry = ?,
            fitness_expiry = ?, rc_number = ?, status = ?
         WHERE id = ?`,
        [
            vehicleNumber, vehicleType, make, model,
            year, color, registrationDate, insuranceExpiry,
            fitnessExpiry, rcNumber, status, id
        ]
    );

    if (result.affectedRows === 0) {
        throw createError('Vehicle not found', 404);
    }

    res.json({
        success: true,
        message: 'Vehicle updated successfully'
    });
}));

// Delete vehicle
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
        'DELETE FROM vehicles WHERE id = ?',
        [id]
    );

    if (result.affectedRows === 0) {
        throw createError('Vehicle not found', 404);
    }

    res.json({
        success: true,
        message: 'Vehicle deleted successfully'
    });
}));

export default router;

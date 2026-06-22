import { Router, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import Joi from 'joi';
import { validate as validateBody, validateQuery } from '../utils/validation';

const router = Router();

// Validation Schemas
const tripSheetSchema = Joi.object({
    vehicleNumber: Joi.string().required(),
    driverName: Joi.string().required(),
    driverPhone: Joi.string().required(),
    fromLocation: Joi.string().required(),
    toLocation: Joi.string().required(),
    departureDate: Joi.string().required(),
    returnDate: Joi.string().allow('', null),
    purpose: Joi.string().allow('', null),
    distanceKm: Joi.number().default(0),
    fuelCost: Joi.number().default(0),
    status: Joi.string().valid('planned', 'in-transit', 'completed', 'cancelled').default('planned'),
});

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('', null),
});

// Helper to generate trip number
async function generateTripNumber(): Promise<string> {
    const prefix = 'TRIP';
    const date = new Date();
    const yearMonth = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    const result = await query(
        `SELECT trip_number FROM trip_sheets
         WHERE trip_number LIKE ?
         ORDER BY id DESC LIMIT 1`,
        [`${prefix}-${yearMonth}-%`]
    );

    let nextNumber = 1;
    if (result.rows && result.rows.length > 0) {
        const lastNumber = parseInt(result.rows[0].trip_number.split('-').pop());
        nextNumber = lastNumber + 1;
    }

    return `${prefix}-${yearMonth}-${nextNumber.toString().padStart(4, '0')}`;
}

// Get all trip sheets
router.get('/', authenticate, validateQuery(paginationSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, search } = req.query as any;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params: any[] = [];

    if (search) {
        whereClause += ' AND (trip_number LIKE ? OR vehicle_number LIKE ? OR driver_name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countResult = await query(
        `SELECT COUNT(*) as total FROM trip_sheets ${whereClause}`,
        params
    );
    const total = countResult.rows.length > 0 ? (countResult.rows[0].total ?? 0) : 0;

    const result = await query(
        `SELECT * FROM trip_sheets ${whereClause} ORDER BY created_date DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
    );

    const data = result.rows.map((row: any) => ({
        id: row.id,
        tripNumber: row.trip_number,
        vehicleNumber: row.vehicle_number,
        driverName: row.driver_name,
        driverPhone: row.driver_phone,
        fromLocation: row.from_location,
        toLocation: row.to_location,
        departureDate: row.departure_date,
        returnDate: row.return_date,
        purpose: row.purpose,
        distanceKm: row.distance_km,
        fuelCost: row.fuel_cost,
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

// Get single trip sheet
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
        'SELECT * FROM trip_sheets WHERE id = ?',
        [id]
    );

    if (!result.rows || result.rows.length === 0) {
        throw createError('Trip sheet not found', 404);
    }

    const row = result.rows[0];
    const data = {
        id: row.id,
        tripNumber: row.trip_number,
        vehicleNumber: row.vehicle_number,
        driverName: row.driver_name,
        driverPhone: row.driver_phone,
        fromLocation: row.from_location,
        toLocation: row.to_location,
        departureDate: row.departure_date,
        returnDate: row.return_date,
        purpose: row.purpose,
        distanceKm: row.distance_km,
        fuelCost: row.fuel_cost,
        status: row.status,
        createdAt: row.created_date,
        updatedAt: row.updated_date,
    };

    res.json({
        success: true,
        data
    });
}));

// Create trip sheet
router.post('/', authenticate, validateBody(tripSheetSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const tripNumber = await generateTripNumber();

    const {
        vehicleNumber,
        driverName,
        driverPhone,
        fromLocation,
        toLocation,
        departureDate,
        returnDate,
        purpose,
        distanceKm,
        fuelCost,
        status,
    } = req.body;

    await query(
        `INSERT INTO trip_sheets (
            trip_number, vehicle_number, driver_name, driver_phone,
            from_location, to_location, departure_date, return_date,
            purpose, distance_km, fuel_cost, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            tripNumber, vehicleNumber, driverName, driverPhone,
            fromLocation, toLocation, departureDate, returnDate,
            purpose, distanceKm || 0, fuelCost || 0, status || 'planned', userId
        ]
    );

    res.status(201).json({
        success: true,
        message: 'Trip sheet created successfully',
        data: { tripNumber }
    });
}));

// Update trip sheet
router.put('/:id', authenticate, validateBody(tripSheetSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const {
        vehicleNumber,
        driverName,
        driverPhone,
        fromLocation,
        toLocation,
        departureDate,
        returnDate,
        purpose,
        distanceKm,
        fuelCost,
        status,
    } = req.body;

    const result = await query(
        `UPDATE trip_sheets SET
            vehicle_number = ?, driver_name = ?, driver_phone = ?,
            from_location = ?, to_location = ?, departure_date = ?,
            return_date = ?, purpose = ?, distance_km = ?,
            fuel_cost = ?, status = ?
         WHERE id = ?`,
        [
            vehicleNumber, driverName, driverPhone,
            fromLocation, toLocation, departureDate,
            returnDate, purpose, distanceKm,
            fuelCost, status, id
        ]
    );

    if (result.affectedRows === 0) {
        throw createError('Trip sheet not found', 404);
    }

    res.json({
        success: true,
        message: 'Trip sheet updated successfully'
    });
}));

// Delete trip sheet
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
        'DELETE FROM trip_sheets WHERE id = ?',
        [id]
    );

    if (result.affectedRows === 0) {
        throw createError('Trip sheet not found', 404);
    }

    res.json({
        success: true,
        message: 'Trip sheet deleted successfully'
    });
}));

export default router;

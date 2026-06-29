import { Router, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import Joi from 'joi';
import { validate as validateBody, validateQuery } from '../utils/validation';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Validation Schemas
const gatePassSchema = Joi.object({
    type: Joi.string().valid('inward', 'outward').required(),
    partyName: Joi.string().required(),
    vehicleNumber: Joi.string().required(),
    driverName: Joi.string().required(),
    driverPhone: Joi.string().required(),
    purpose: Joi.string().allow('', null),
    itemsDescription: Joi.string().required(),
    quantity: Joi.number().required(),
    unit: Joi.string().default('pcs'),
    remarks: Joi.string().allow('', null),
    status: Joi.string().valid('pending', 'approved', 'rejected', 'completed').default('pending'),
});

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('', null),
    type: Joi.string().valid('inward', 'outward').allow(null),
});

// Helper to generate gate pass number
async function generateGatePassNumber(type: 'inward' | 'outward'): Promise<string> {
    const prefix = type === 'inward' ? 'GPI' : 'GPO';
    const date = new Date();
    const yearMonth = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    const result = await query(
        `SELECT gate_pass_number FROM gate_passes 
         WHERE gate_pass_number LIKE ? 
         ORDER BY id DESC LIMIT 1`,
        [`${prefix}-${yearMonth}-%`]
    );

    let nextNumber = 1;
    if (result.rows && result.rows.length > 0) {
        const lastNumber = parseInt(result.rows[0].gate_pass_number.split('-').pop());
        nextNumber = lastNumber + 1;
    }

    return `${prefix}-${yearMonth}-${nextNumber.toString().padStart(4, '0')}`;
}

// Get all gate passes
router.get('/', authenticate, validateQuery(paginationSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, search, type } = req.query as any;
    const offset = (page - 1) * limit;
    const agencyId = req.user!.agencyId;

    let whereClause = 'WHERE 1=1';
    let params: any[] = [];

    if (search) {
        whereClause += ' AND (gate_pass_number LIKE ? OR party_name LIKE ? OR vehicle_number LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (type) {
        whereClause += ' AND type = ?';
        params.push(type);
    }

    // Get total count â€” safe null check on result
    const countResult = await query(
        `SELECT COUNT(*) as total FROM gate_passes ${whereClause}`,
        params
    );
    const total = countResult.rows.length > 0 ? (countResult.rows[0].total ?? 0) : 0;

    // Get records (schema uses created_date not created_date)
    const result = await query(
        `SELECT * FROM gate_passes ${whereClause} ORDER BY created_date DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
    );

    // Map camelCase for frontend
    const data = result.rows.map((row: any) => ({
        id: row.id,
        gatePassNumber: row.gate_pass_number,
        type: row.type,
        partyName: row.party_name,
        vehicleNumber: row.vehicle_number,
        driverName: row.driver_name,
        driverPhone: row.driver_phone,
        purpose: row.purpose,
        itemsDescription: row.items_description,
        quantity: row.quantity,
        unit: row.unit,
        remarks: row.remarks,
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

// Get single gate pass
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const agencyId = req.user!.agencyId;

    const result = await query(
        'SELECT * FROM gate_passes WHERE id = ?',
        [id]
    );

    if (!result.rows || result.rows.length === 0) {
        throw createError('Gate pass not found', 404);
    }

    const row = result.rows[0];
    const data = {
        id: row.id,
        gatePassNumber: row.gate_pass_number,
        type: row.type,
        partyName: row.party_name,
        vehicleNumber: row.vehicle_number,
        driverName: row.driver_name,
        driverPhone: row.driver_phone,
        purpose: row.purpose,
        itemsDescription: row.items_description,
        quantity: row.quantity,
        unit: row.unit,
        remarks: row.remarks,
        status: row.status,
        createdAt: row.created_date,
        updatedAt: row.updated_date,
    };

    res.json({
        success: true,
        data
    });
}));

// Create gate pass
router.post('/', authenticate, validateBody(gatePassSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const agencyId = req.user!.agencyId;
    const userId = req.user!.id;
    const gatePassNumber = await generateGatePassNumber(req.body.type);

    const {
        type,
        partyName,
        vehicleNumber,
        driverName,
        driverPhone,
        purpose,
        itemsDescription,
        quantity,
        unit,
        remarks,
        status
    } = req.body;

    await query(
        `INSERT INTO gate_passes (
            gate_pass_number, type, party_name, vehicle_number,
            driver_name, driver_phone, purpose, items_description,
            quantity, unit, remarks, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            gatePassNumber, type, partyName, vehicleNumber,
            driverName, driverPhone, purpose, itemsDescription,
            quantity, unit, remarks, status || 'pending', userId
        ]
    );

    res.status(201).json({
        success: true,
        message: 'Gate pass created successfully',
        data: { gatePassNumber }
    });
}));

// Update gate pass
router.put('/:id', authenticate, validateBody(gatePassSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const agencyId = req.user!.agencyId;

    const {
        type,
        partyName,
        vehicleNumber,
        driverName,
        driverPhone,
        purpose,
        itemsDescription,
        quantity,
        unit,
        remarks,
        status
    } = req.body;

    const result = await query(
        `UPDATE gate_passes SET 
            type = ?, party_name = ?, vehicle_number = ?, 
            driver_name = ?, driver_phone = ?, purpose = ?, 
            items_description = ?, quantity = ?, unit = ?, 
            remarks = ?, status = ?
         WHERE id = ?`,
        [
            type, partyName, vehicleNumber,
            driverName, driverPhone, purpose,
            itemsDescription, quantity, unit,
            remarks, status, id
        ]
    );

    if (result.affectedRows === 0) {
        throw createError('Gate pass not found or unauthorized', 404);
    }

    res.json({
        success: true,
        message: 'Gate pass updated successfully'
    });
}));

// Delete gate pass
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const agencyId = req.user!.agencyId;

    const result = await query(
        'DELETE FROM gate_passes WHERE id = ?',
        [id]
    );

    if (result.affectedRows === 0) {
        throw createError('Gate pass not found or unauthorized', 404);
    }

    res.json({
        success: true,
        message: 'Gate pass deleted successfully'
    });
}));

export default router;


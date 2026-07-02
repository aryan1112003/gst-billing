import { Router, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import Joi from 'joi';
import { validate as validateBody, validateQuery } from '../utils/validation';

const router = Router();

// Validation Schemas
const shipmentSchema = Joi.object({
    type: Joi.string().valid('import', 'export').required(),
    partyName: Joi.string().required(),
    country: Joi.string().required(),
    port: Joi.string().allow('', null),
    billOfLading: Joi.string().allow('', null),
    shipmentDate: Joi.string().required(),
    clearanceDate: Joi.string().allow('', null),
    dutyAmount: Joi.number().default(0),
    freightAmount: Joi.number().default(0),
    totalValue: Joi.number().default(0),
    currency: Joi.string().default('INR'),
    status: Joi.string().valid('in-transit', 'at-port', 'cleared', 'delivered').default('in-transit'),
});

const shipmentUpdateSchema = Joi.object({
    type: Joi.string().valid('import', 'export'),
    partyName: Joi.string(),
    country: Joi.string(),
    port: Joi.string().allow('', null),
    billOfLading: Joi.string().allow('', null),
    shipmentDate: Joi.string(),
    clearanceDate: Joi.string().allow('', null),
    dutyAmount: Joi.number(),
    freightAmount: Joi.number(),
    totalValue: Joi.number(),
    currency: Joi.string(),
    status: Joi.string().valid('in-transit', 'at-port', 'cleared', 'delivered'),
});

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('', null),
});

// Helper to generate shipment number
async function generateShipmentNumber(): Promise<string> {
    const prefix = 'SHP';
    const date = new Date();
    const yearMonth = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    const result = await query(
        `SELECT shipment_number FROM customs_shipments
         WHERE shipment_number LIKE ?
         ORDER BY id DESC LIMIT 1`,
        [`${prefix}-${yearMonth}-%`]
    );

    let nextNumber = 1;
    if (result.rows && result.rows.length > 0) {
        const lastNumber = parseInt(result.rows[0].shipment_number.split('-').pop());
        nextNumber = lastNumber + 1;
    }

    return `${prefix}-${yearMonth}-${nextNumber.toString().padStart(4, '0')}`;
}

// Get all customs shipments
router.get('/', authenticate, validateQuery(paginationSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, search } = req.query as any;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params: any[] = [];

    if (search) {
        whereClause += ' AND (shipment_number LIKE ? OR party_name LIKE ? OR country LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countResult = await query(
        `SELECT COUNT(*) as total FROM customs_shipments ${whereClause}`,
        params
    );
    const total = countResult.rows.length > 0 ? (countResult.rows[0].total ?? 0) : 0;

    const result = await query(
        `SELECT * FROM customs_shipments ${whereClause} ORDER BY created_date DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
    );

    const data = result.rows.map((row: any) => ({
        id: row.id,
        shipmentNumber: row.shipment_number,
        type: row.type,
        partyName: row.party_name,
        country: row.country,
        port: row.port,
        billOfLading: row.bill_of_lading,
        shipmentDate: row.shipment_date,
        clearanceDate: row.clearance_date,
        dutyAmount: row.duty_amount,
        freightAmount: row.freight_amount,
        totalValue: row.total_value,
        currency: row.currency,
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

// Get single customs shipment
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
        'SELECT * FROM customs_shipments WHERE id = ?',
        [id]
    );

    if (!result.rows || result.rows.length === 0) {
        throw createError('Customs shipment not found', 404);
    }

    const row = result.rows[0];
    const data = {
        id: row.id,
        shipmentNumber: row.shipment_number,
        type: row.type,
        partyName: row.party_name,
        country: row.country,
        port: row.port,
        billOfLading: row.bill_of_lading,
        shipmentDate: row.shipment_date,
        clearanceDate: row.clearance_date,
        dutyAmount: row.duty_amount,
        freightAmount: row.freight_amount,
        totalValue: row.total_value,
        currency: row.currency,
        status: row.status,
        createdAt: row.created_date,
        updatedAt: row.updated_date,
    };

    res.json({
        success: true,
        data
    });
}));

// Create customs shipment
router.post('/', authenticate, validateBody(shipmentSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const shipmentNumber = await generateShipmentNumber();

    const {
        type,
        partyName,
        country,
        port,
        billOfLading,
        shipmentDate,
        clearanceDate,
        dutyAmount,
        freightAmount,
        totalValue,
        currency,
        status,
    } = req.body;

    const result = await query(
        `INSERT INTO customs_shipments (
            shipment_number, type, party_name, country,
            port, bill_of_lading, shipment_date, clearance_date,
            duty_amount, freight_amount, total_value, currency,
            status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            shipmentNumber, type, partyName, country,
            port, billOfLading, shipmentDate, clearanceDate,
            dutyAmount || 0, freightAmount || 0, totalValue || 0, currency || 'INR',
            status || 'in-transit', userId
        ]
    );

    res.status(201).json({
        success: true,
        message: 'Customs shipment created successfully',
        data: { id: result.insertId, shipmentNumber }
    });
}));

// Update customs shipment
router.put('/:id', authenticate, validateBody(shipmentUpdateSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const {
        type,
        partyName,
        country,
        port,
        billOfLading,
        shipmentDate,
        clearanceDate,
        dutyAmount,
        freightAmount,
        totalValue,
        currency,
        status,
    } = req.body;

    const fields: string[] = [];
    const vals: any[] = [];
    if (type !== undefined) { fields.push('type = ?'); vals.push(type); }
    if (partyName !== undefined) { fields.push('party_name = ?'); vals.push(partyName); }
    if (country !== undefined) { fields.push('country = ?'); vals.push(country); }
    if (port !== undefined) { fields.push('port = ?'); vals.push(port); }
    if (billOfLading !== undefined) { fields.push('bill_of_lading = ?'); vals.push(billOfLading); }
    if (shipmentDate !== undefined) { fields.push('shipment_date = ?'); vals.push(shipmentDate); }
    if (clearanceDate !== undefined) { fields.push('clearance_date = ?'); vals.push(clearanceDate); }
    if (dutyAmount !== undefined) { fields.push('duty_amount = ?'); vals.push(dutyAmount); }
    if (freightAmount !== undefined) { fields.push('freight_amount = ?'); vals.push(freightAmount); }
    if (totalValue !== undefined) { fields.push('total_value = ?'); vals.push(totalValue); }
    if (currency !== undefined) { fields.push('currency = ?'); vals.push(currency); }
    if (status !== undefined) { fields.push('status = ?'); vals.push(status); }
    if (fields.length === 0) throw createError('No fields to update', 400);

    const result = await query(
        `UPDATE customs_shipments SET ${fields.join(', ')} WHERE id = ?`,
        [...vals, id]
    );

    if (result.affectedRows === 0) {
        throw createError('Customs shipment not found', 404);
    }

    res.json({
        success: true,
        message: 'Customs shipment updated successfully'
    });
}));

// Delete customs shipment
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await query(
        'DELETE FROM customs_shipments WHERE id = ?',
        [id]
    );

    if (result.affectedRows === 0) {
        throw createError('Customs shipment not found', 404);
    }

    res.json({
        success: true,
        message: 'Customs shipment deleted successfully'
    });
}));

export default router;

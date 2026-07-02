import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { agencyService } from '../services/agencyService';
import { checkEmployeeLimit } from '../middleware/subscriptionLimits';
import { cloudinaryUpload, uploadToCloudinary, deleteFromCloudinary, extractPublicId, FOLDERS } from '../services/cloudinaryService';

const router = Router();



// Get all users (Admin and Agency Admin)
router.get('/', authenticate, requireRole(['admin', 'agency']), asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params: any[] = [];

    // Agency Admin restriction: Only see users in their agency
    if (req.user!.role === 'agency') {
        whereClause += ' AND (agency_id = ? OR agecny_id = ?)';
        params.push(req.user!.agencyId, req.user!.agencyId);
    }

    if (search) {
        whereClause += ' AND (email ILIKE ? OR name ILIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const countResult = await query(
        `SELECT COUNT(*) as total FROM users ${whereClause}`,
        params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Get users
    const result = await query(
        `SELECT id, name, email, roleId, agecny_id as agency_id, is_active 
     FROM users ${whereClause} 
     ORDER BY id DESC 
     LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    res.json({
        success: true,
        data: result.rows,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
            limit,
        },
    });
}));

// Get user by ID (Admin and Agency Admin)
router.get('/:id', authenticate, requireRole(['admin', 'agency']), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    let whereClause = 'WHERE id = ?';
    let params: any[] = [id];

    // Agency Admin restriction
    if (req.user!.role === 'agency') {
        whereClause += ' AND (agency_id = ? OR agecny_id = ?)';
        params.push(req.user!.agencyId, req.user!.agencyId);
    }

    const result = await query(
        `SELECT id, name, email, roleId, agecny_id as agency_id, is_active FROM users ${whereClause}`,
        params
    );

    if (!result.rows || result.rows.length === 0) {
        throw createError('User not found or access denied', 404);
    }

    res.json({
        success: true,
        data: result.rows[0],
    });
}));

// Create user (Admin and Agency Admin)
router.post('/', authenticate, requireRole(['admin', 'agency']), checkEmployeeLimit, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, name, username, password, roleId, agencyId, companyData, is_active } = req.body;

    const finalName = name || username;
    if (!email || !finalName || !password) {
        throw createError('Email, name, and password are required', 400);
    }

    if (password.length < 6) {
        throw createError('Password must be at least 6 characters', 400);
    }

    // Determine target Agency ID
    let finalAgencyId = agencyId;
    if (req.user!.role === 'agency') {
        finalAgencyId = req.user!.agencyId; // Force their own agency
        // Prevent creating Admins or other Agencies
        if (roleId == 1 || roleId == 2) {
            throw createError('Agency admins can only create regular users', 403);
        }
    } else {
        finalAgencyId = agencyId ?? null;
    }

    // Check if email already exists
    const emailCheck = await query(
        'SELECT id FROM users WHERE email = ?',
        [email.toLowerCase()]
    );

    if (emailCheck.rows && emailCheck.rows.length > 0) {
        throw createError('Mail already registered', 400);
    }

    let agencyInfo = null;

    // Logic for System Admin creating a new Agency (Role ID 2)
    if ((roleId === 2 || roleId === '2') && req.user!.role === 'admin') {
        if (!companyData || !companyData.companyName) {
            throw createError('Company data with companyName is required for agency users', 400);
        }

        try {
            const agency = await agencyService.createAgency({
                companyName: companyData.companyName,
                email: companyData.email || email,
                password: password,
                phone: companyData.phone,
                address: companyData.address,
                gstNumber: companyData.gstNumber,
                panNumber: companyData.panNumber,
                logoUrl: companyData.logoUrl,
                subscriptionPlan: companyData.subscriptionPlan || 'basic',
                userName: finalName || companyData.companyName
            });

            finalAgencyId = agency.id;
            agencyInfo = agency;
            console.log(`✓ Agency database created: ${agency.database_name}`);
        } catch (error: any) {
            console.error('Error creating agency database:', error);
            throw createError(`Failed to create agency database: ${error.message}`, 500);
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
        `INSERT INTO users (name, email, password, password_hash, roleId, agecny_id, agency_id, is_active, createdBy, createdDtm)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
            finalName,
            email.toLowerCase(),
            hashedPassword,
            hashedPassword,
            roleId || 3,
            finalAgencyId ?? null,
            finalAgencyId ?? null,
            is_active !== undefined ? (is_active ? 1 : 0) : 1,
            req.user!.id
        ]
    );

    const newUserId = result.insertId;

    const newUser = await query(
        'SELECT id, name, email, roleId, agecny_id as agency_id, is_active FROM users WHERE id = ?',
        [newUserId]
    );

    res.status(201).json({
        success: true,
        data: {
            user: newUser.rows[0],
            agency: agencyInfo
        },
        message: 'User created successfully',
    });
}));

// Update user (Admin and Agency Admin)
router.put('/:id', authenticate, requireRole(['admin', 'agency']), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { email, name, username, password, roleId, agencyId, is_active } = req.body;

    // Check availability and permission
    let checkQuery = 'SELECT id, agency_id, agecny_id FROM users WHERE id = ?';
    let checkParams: any[] = [id];

    if (req.user!.role === 'agency') {
        checkQuery += ' AND (agency_id = ? OR agecny_id = ?)';
        checkParams.push(req.user!.agencyId, req.user!.agencyId);
    }

    const userCheck = await query(checkQuery, checkParams);
    if (!userCheck.rows || userCheck.rows.length === 0) {
        throw createError('User not found or access denied', 404);
    }

    // Prevent Agency Admin from creating Admins via update
    if (req.user!.role === 'agency') {
        if (roleId && (roleId == 1 || roleId == 2)) {
            throw createError('Agency admins cannot promote users to Admin/Agency permissions', 403);
        }
        // Cannot change agencyId
        if (agencyId && agencyId != req.user!.agencyId) {
            throw createError('Cannot move user to another agency', 403);
        }
    }

    const updates: string[] = [];
    const updateParams: any[] = [];

    if (email !== undefined) {
        const emailCheck = await query(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email.toLowerCase(), id]
        );
        if (emailCheck.rows && emailCheck.rows.length > 0) {
            throw createError('Email already taken by another user', 400);
        }
        updates.push('email = ?');
        updateParams.push(email.toLowerCase());
    }

    const finalName = name || username;
    if (finalName !== undefined) {
        updates.push('name = ?');
        updateParams.push(finalName);
    }

    if (password) {
        if (password.length < 6) {
            throw createError('Password must be at least 6 characters', 400);
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        updates.push('password_hash = ?');
        updateParams.push(hashedPassword);
    }

    if (roleId !== undefined) {
        updates.push('roleId = ?');
        updateParams.push(roleId);
    }

    if (agencyId !== undefined && req.user!.role === 'admin') {
        updates.push('agecny_id = ?');
        updates.push('agency_id = ?');
        updateParams.push(agencyId);
        updateParams.push(agencyId);
    }

    if (is_active !== undefined) {
        updates.push('is_active = ?');
        updateParams.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
        throw createError('No fields to update', 400);
    }

    updateParams.push(id);

    await query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        updateParams
    );

    const updatedUser = await query(
        'SELECT id, name, email, roleId, agecny_id as agency_id, is_active FROM users WHERE id = ?',
        [id]
    );

    res.json({
        success: true,
        data: updatedUser.rows[0],
        message: 'User updated successfully',
    });
}));

// Delete user (Admin and Agency Admin)
router.delete('/:id', authenticate, requireRole(['admin', 'agency']), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (String(req.user!.id) === String(id)) {
        throw createError('You cannot delete your own account', 400);
    }

    let checkQuery = 'SELECT id FROM users WHERE id = ?';
    let checkParams: any[] = [id];

    if (req.user!.role === 'agency') {
        checkQuery += ' AND (agency_id = ? OR agecny_id = ?)';
        checkParams.push(req.user!.agencyId, req.user!.agencyId);
    }

    const userCheck = await query(checkQuery, checkParams);
    if (!userCheck.rows || userCheck.rows.length === 0) {
        throw createError('User not found or access denied', 404);
    }

    await query('DELETE FROM users WHERE id = ?', [id]);

    res.json({
        success: true,
        message: 'User deleted successfully',
    });
}));

/**
 * Upload user profile picture to Cloudinary
 * POST /api/users/:id/avatar
 */
router.post('/:id/avatar', authenticate, cloudinaryUpload.single('avatar'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) throw createError('Invalid user ID', 400);
    if (!req.file) throw createError('No file uploaded', 400);

    // Users can only update their own avatar; admins can update any
    if (req.user!.role !== 'admin' && String(req.user!.id) !== String(userId)) {
        throw createError('You do not have permission to update this profile picture', 403);
    }

    // Fetch existing avatar
    const existing = await query('SELECT id, avatar_url FROM users WHERE id = ?', [userId]);
    if (existing.rows.length === 0) throw createError('User not found', 404);

    // Delete old avatar from Cloudinary if it exists
    const oldUrl = existing.rows[0].avatar_url;
    if (oldUrl) {
        const oldPublicId = extractPublicId(oldUrl);
        if (oldPublicId) await deleteFromCloudinary(oldPublicId);
    }

    // Upload new avatar
    const result = await uploadToCloudinary(
        req.file.buffer,
        FOLDERS.profiles,
        `user-${userId}-${Date.now()}`
    );

    const avatarUrl: string = result.secure_url;

    await query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, userId]);

    res.json({
        success: true,
        message: 'Profile picture updated successfully',
        data: {
            avatarUrl,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
        },
    });
}));

export default router;

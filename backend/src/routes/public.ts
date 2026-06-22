import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { query } from '../config/database';
import { subscriptionService } from '../services/subscriptionService';
import { emailService } from '../services/emailService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const router = Router();

/**
 * POST /api/v1/public/register-agency
 * Public endpoint for agency/user self-registration
 */
router.post('/register-agency', asyncHandler(async (req: Request, res: Response) => {
    const {
        accountType, // 'agency' or 'user'
        companyName,
        ownerName,
        email,
        password,
        phone,
        address,
        city,
        state,
        zipCode,
        gstNumber,
    } = req.body;

    // Validation
    if (!accountType || !ownerName || !email || !password) {
        throw createError('Account type, name, email, and password are required', 400);
    }

    if (accountType === 'agency' && !companyName) {
        throw createError('Company name is required for agency accounts', 400);
    }

    // Check if email already exists
    const existingUser = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existingUser.rows && existingUser.rows.length > 0) {
        throw createError('Email already registered', 400);
    }

    // Generate unique database name for multi-tenancy
    const databaseName = `${accountType}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // For user accounts, use owner name as company name
    const finalCompanyName = accountType === 'agency' ? companyName : `${ownerName}'s Account`;

    try {
        // 1. Create Agency/User Account
        const agencyResult = await query(
            `INSERT INTO agencies 
       (company_name, database_name, email, phone, address, city, state, zip_code, gst_number, account_type, status, is_trial, trial_started_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'inactive', TRUE, NOW())`,
            [
                finalCompanyName,
                databaseName,
                email,
                phone || null,
                address || null,
                city || null,
                state || null,
                zipCode || null,
                gstNumber || null,
                accountType
            ]
        );

        const agencyId = agencyResult.insertId;

        // 2. Create Owner User (Inactive)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        const userResult = await query(
            `INSERT INTO users 
       (name, email, password, password_hash, role, roleId, agency_id, agecny_id, is_active, createdBy, createdDtm, reset_password_token, reset_password_expires)
       VALUES (?, ?, ?, ?, 'agency', 2, ?, ?, 0, 1, NOW(), ?, NOW() + INTERVAL '15 minutes')`,
            [ownerName, email.toLowerCase(), hashedPassword, hashedPassword, agencyId, agencyId, otp]
        );

        const userId = userResult.insertId;

        // 3. Link owner to agency
        await query('UPDATE agencies SET owner_user_id = ? WHERE id = ?', [userId, agencyId]);

        // 4. Create Trial Subscription
        const subscription = await subscriptionService.createTrialSubscription(agencyId);

        // 5. Send OTP Email
        try {
            await emailService.sendOtpEmail(email, otp, 'Email Verification');
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'OTP sent to your email. Please verify to complete registration.',
            data: {
                userId,
                email: email.toLowerCase(),
                requiresVerification: true
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        throw createError('Registration failed. Please try again.', 500);
    }
}));

/**
 * POST /api/v1/public/verify-registration-otp
 */
router.post('/verify-registration-otp', asyncHandler(async (req: Request, res: Response) => {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
        throw createError('User ID and OTP are required', 400);
    }

    // Verify OTP
    console.log(`Verifying OTP for User: ${userId}, Input: ${otp}`);

    // First check user existence
    const userCheck = await query('SELECT id, reset_password_token, reset_password_expires, NOW() as db_time FROM users WHERE id = ?', [userId]);
    console.log('User DB State:', userCheck.rows[0]);

    const userResult = await query(
        `SELECT u.id, u.email, u.name, u.role, u.roleId, u.agecny_id, a.account_type 
         FROM users u
         LEFT JOIN agencies a ON u.agecny_id = a.id
         WHERE u.id = ? AND u.reset_password_token = ? AND u.reset_password_expires > NOW()`,
        [userId, otp]
    );

    if (!userResult.rows || userResult.rows.length === 0) {
        console.error('OTP Verification Failed. Query returned no rows.');
        throw createError('Invalid or expired OTP', 400);
    }

    const user = userResult.rows[0];
    const agencyId = user.agecny_id;
    const accountType = user.account_type;

    // Activate User and Agency
    await query('UPDATE users SET is_active = 1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?', [userId]);
    await query('UPDATE agencies SET status = "active" WHERE id = ?', [agencyId]);

    // Get Subscription info
    const subResult = await query('SELECT status, trial_ends_at FROM subscriptions WHERE agency_id = ?', [agencyId]);
    const subscription = subResult.rows[0];

    // Generate JWT tokens
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

    const token = jwt.sign(
        { id: userId, email: user.email, role: user.role, agencyId, accountType },
        jwtSecret as jwt.Secret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
        { id: userId },
        jwtRefreshSecret as jwt.Secret,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' } as jwt.SignOptions
    );

    res.json({
        success: true,
        message: 'Email verified successfully',
        data: {
            user: {
                id: userId,
                email: user.email,
                username: user.name,
                role: user.role,
                agencyId,
                accountType,
                isTrial: true,
                trialEndsAt: subscription.trial_ends_at,
            },
            token,
            refreshToken
        }
    });
}));

/**
 * POST /api/v1/public/resend-registration-otp
 */
router.post('/resend-registration-otp', asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.body;

    if (!userId) {
        throw createError('User ID is required', 400);
    }

    const userResult = await query('SELECT email FROM users WHERE id = ?', [userId]);
    if (!userResult.rows || userResult.rows.length === 0) {
        throw createError('User not found', 404);
    }

    const email = userResult.rows[0].email;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await query("UPDATE users SET reset_password_token = ?, reset_password_expires = NOW() + INTERVAL '15 minutes' WHERE id = ?", [otp, userId]);

    try {
        await emailService.sendOtpEmail(email, otp, 'Email Verification');
    } catch (error) {
        console.error('Failed to resend OTP:', error);
    }

    res.json({
        success: true,
        message: 'Verification code resent to your email'
    });
}));

export default router;

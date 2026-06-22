import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { query } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import crypto from 'crypto';
import { emailService } from '../services/emailService';

const router = Router();

// Login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {

  const { email, password } = req.body;

  if (!email || !password) {
    throw createError('Email and password are required', 400);
  }

  // Get user from database
  const result = await query(
    'SELECT id, email, password, password_hash, name, roleid, agency_id, agecny_id, is_active FROM users WHERE email = ? ORDER BY id ASC LIMIT 1',
    [email.toLowerCase()]
  );

  if (!result.rows || result.rows.length === 0) {
    throw createError('Invalid credentials', 401);
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw createError('Account is deactivated', 401);
  }

  // Verify password - check both MD5 (old) and bcrypt (new) passwords
  let isValidPassword = false;

  // 1. First try bcrypt if password_hash exists (New Standard)
  if (user.password_hash) {
    try {
      isValidPassword = await bcrypt.compare(password, user.password_hash);
    } catch (e) {
      isValidPassword = false;
    }
  }

  // 2. If no valid password yet, check 'password' column
  if (!isValidPassword && user.password) {
    // Check if the 'password' column holds a BCrypt hash (starts with $2a$, $2b$, or $2y$)
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
      try {
        isValidPassword = await bcrypt.compare(password, user.password);
        // Fix: Migrate this hash to the correct column if login succeeds
        if (isValidPassword) {
          await query('UPDATE users SET password_hash = ? WHERE id = ?', [user.password, user.id]);
        }
      } catch (e) {
        isValidPassword = false;
      }
    } else {
      // Assume it's the old MD5 hash
      const crypto = require('crypto');
      const md5Hash = crypto.createHash('md5').update(password).digest('hex');
      isValidPassword = (md5Hash === user.password);

      // If MD5 matched, upgrade account to bcrypt for future logins
      if (isValidPassword) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, user.id]);
      }
    }
  }

  if (!isValidPassword) {
    throw createError('Invalid credentials', 401);
  }

  // Map roleId to role name
  // Map roleId to role name
  const roleMap: { [key: number]: string } = {
    1: 'admin',
    2: 'agency',
    3: 'user'
  };
  // Fallback to user.role (string column) if roleId mapping fails or matches user but role column is different
  let roleName = roleMap[user.roleid] || 'user';

  // Robustness check: If roleId mapped to 'user' but the role column says 'admin' or 'agency', trust the role column
  if (roleName === 'user' && user.role && ['admin', 'agency'].includes(user.role)) {
    roleName = user.role;
  }

  // Generate tokens
  const accessTokenPayload = { userId: user.id, email: user.email, role: roleName };
  const accessTokenOptions = { expiresIn: config.jwt.expiresIn } as any;
  const accessToken = jwt.sign(accessTokenPayload, config.jwt.secret, accessTokenOptions);

  const refreshTokenPayload = { userId: user.id };
  const refreshTokenOptions = { expiresIn: config.jwt.refreshExpiresIn } as any;
  const refreshToken = jwt.sign(refreshTokenPayload, config.jwt.refreshSecret, refreshTokenOptions);

  // Store refresh token in database (if table exists)
  try {
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    );
  } catch (e) {
    // Table might not exist, continue anyway
  }

  // Update last login (non-critical)
  try {
    await query('UPDATE users SET updateddtm = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
  } catch (e) {}

  // Fetch subscription info for agency users
  let subscriptionData = { is_trial: false, trial_ends_at: null };
  if (user.agency_id || user.agecny_id) {
    const subResult = await query(
      'SELECT status, trial_ends_at FROM subscriptions WHERE agency_id = ?',
      [user.agency_id || user.agecny_id]
    );
    if (subResult.rows && subResult.rows.length > 0) {
      const sub = subResult.rows[0];
      subscriptionData = {
        is_trial: sub.status === 'trial',
        trial_ends_at: sub.trial_ends_at
      };
    }
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.name || user.email,
      name: user.name,
      role: roleName,
      agencyId: user.agency_id || user.agecny_id || null,
      permissions: [],
      isActive: user.is_active,
      isTrial: subscriptionData.is_trial,
      trialEndsAt: subscriptionData.trial_ends_at,
      createdAt: user.createddtm,
      updatedAt: user.updateddtm,
    },
    token: accessToken,
    refreshToken: refreshToken,
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw createError('Refresh token is required', 400);
  }

  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret as string) as any;

    // Check if refresh token exists and is not revoked
    const tokenResult = await query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ? AND expires_at > CURRENT_TIMESTAMP',
      [refreshToken, decoded.userId]
    );

    if (!tokenResult.rows || tokenResult.rows.length === 0) {
      throw createError('Invalid or expired refresh token', 401);
    }

    // Get user
    const userResult = await query(
      'SELECT id, email, name, roleId, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!userResult.rows || userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      throw createError('User not found or deactivated', 401);
    }

    const user = userResult.rows[0];

    // Map roleId to role name
    const roleMap: { [key: number]: string } = {
      1: 'admin',
      2: 'agency',
      3: 'user'
    };
    const roleName = roleMap[user.roleid] || 'user';

    // Generate new access token
    const accessTokenPayload = { userId: user.id, email: user.email, role: roleName };
    const accessTokenOptions = { expiresIn: config.jwt.expiresIn } as any;
    const accessToken = jwt.sign(accessTokenPayload, config.jwt.secret, accessTokenOptions);

    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    throw createError('Invalid refresh token', 401);
  }
}));

// Logout
router.post('/logout', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Revoke refresh token
    await query(
      'DELETE FROM refresh_tokens WHERE token = ? AND user_id = ?',
      [refreshToken, req.user!.id]
    );
  }

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}));

// Register new user
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password, role = 'user' } = req.body;

  // Validate input
  if (!username || !email || !password) {
    throw createError('Username, email, and password are required', 400);
  }

  // Validate role
  if (!['admin', 'agency', 'user'].includes(role)) {
    throw createError('Invalid role. Must be admin, agency, or user', 400);
  }

  // Check if user already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = ? OR username = ?',
    [email.toLowerCase(), username]
  );

  if (existingUser.rows && existingUser.rows.length > 0) {
    throw createError('User with this email or username already exists', 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);


  // Map role name to roleId
  const roleMap: Record<string, number> = {
    'admin': 1,
    'agency': 2,
    'user': 3
  };
  const roleId = roleMap[role] || 3;

  // Create user - Insert both role (string) and roleId (int) for consistency
  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  const result = await query(
    'INSERT INTO users (name, email, password, password_hash, role, roleid, is_active, verification_token, createdby, createddtm) VALUES (?, ?, ?, ?, ?, ?, 0, ?, 1, NOW())',
    [username, email.toLowerCase(), hashedPassword, hashedPassword, role, roleId, verificationToken]
  );

  // Send verification email
  try {
    await emailService.sendVerificationEmail(email, verificationToken);
  } catch (error) {
    // Log error but don't fail registration completely? 
    // Or fail? Better to warn.
    console.error('Failed to send verification email', error);
  }

  const userId = result.insertId;

  // Get created user
  const userResult = await query(
    'SELECT id, username, email, role, is_active, createddtm FROM users WHERE id = ?',
    [userId]
  );

  const user = userResult.rows[0];

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.createddtm,
      },
    },
  });
}));

// Get current user
router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await query(
    'SELECT id, email, name, role, roleid, agency_id, agecny_id, is_active, createddtm, updateddtm FROM users WHERE id = ?',
    [req.user!.id]
  );

  if (!result.rows || result.rows.length === 0) {
    throw createError('User not found', 404);
  }

  const user = result.rows[0];

  // Map roleId to role name
  const roleMap: { [key: number]: string } = {
    1: 'admin',
    2: 'agency',
    3: 'user'
  };
  // Explicitly trust roleId over role string to ensure permissions align
  let roleName = roleMap[user.roleid] || 'user';

  // Robustness check
  if (roleName === 'user' && user.role && ['admin', 'agency'].includes(user.role)) {
    roleName = user.role;
  }

  // Fetch subscription info for agency users
  let subscriptionData = { is_trial: false, trial_ends_at: null };
  if (user.agency_id || user.agecny_id) {
    const subResult = await query(
      'SELECT status, trial_ends_at FROM subscriptions WHERE agency_id = ?',
      [user.agency_id || user.agecny_id]
    );
    if (subResult.rows && subResult.rows.length > 0) {
      const sub = subResult.rows[0];
      subscriptionData = {
        is_trial: sub.status === 'trial',
        trial_ends_at: sub.trial_ends_at
      };
    }
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email,
        role: roleName,
        agencyId: user.agency_id || user.agecny_id || null,
        permissions: [],
        isActive: user.is_active,
        isTrial: subscriptionData.is_trial,
        trialEndsAt: subscriptionData.trial_ends_at,
        createdAt: user.createddtm,
        updatedAt: user.updateddtm,
      },
    },
  });
}));

// Update Profile
router.put('/profile', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email } = req.body;
  const userId = req.user!.id;

  if (!name && !email) {
    throw createError('Nothing to update', 400);
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (name) {
    updates.push('name = ?');
    params.push(name);
  }

  if (email) {
    // Check if email is already taken
    const existingUser = await query('SELECT id FROM users WHERE email = ? AND id != ?', [email.toLowerCase(), userId]);
    if (existingUser.rows && existingUser.rows.length > 0) {
      throw createError('Email already in use', 400);
    }
    updates.push('email = ?');
    params.push(email.toLowerCase());
  }

  params.push(userId);
  await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

  res.json({
    success: true,
    message: 'Profile updated successfully',
  });
}));

// Change Password
router.post('/change-password', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!.id;

  if (!currentPassword || !newPassword) {
    throw createError('Current and new passwords are required', 400);
  }

  if (newPassword.length < 6) {
    throw createError('New password must be at least 6 characters', 400);
  }

  // Verify current password
  const userResult = await query('SELECT password_hash, password FROM users WHERE id = ?', [userId]);
  const user = userResult.rows[0];

  let isValid = false;
  if (user.password_hash) {
    isValid = await bcrypt.compare(currentPassword, user.password_hash);
  } else if (user.password) {
    const crypto = require('crypto');
    const md5Hash = crypto.createHash('md5').update(currentPassword).digest('hex');
    isValid = (md5Hash === user.password);
  }

  if (!isValid) {
    throw createError('Invalid current password', 401);
  }

  // Update password
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  await query('UPDATE users SET password_hash = ?, password = NULL WHERE id = ?', [hashedNewPassword, userId]);

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
}));

// Verify Email
router.get('/verify-email', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token) throw createError('Token is required', 400);

  const userResult = await query('SELECT id FROM users WHERE verification_token = ?', [token]);

  if (!userResult.rows || userResult.rows.length === 0) {
    return res.status(400).send('<h1>Invalid or expired token</h1>');
  }

  const userId = userResult.rows[0].id;
  await query('UPDATE users SET is_active = 1, verification_token = NULL WHERE id = ?', [userId]);

  res.send(`
    <div style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h1 style="color: green;">Email Verified Successfully!</h1>
      <p>Your account is now active. You can close this window and login to the app.</p>
    </div>
  `);
}));

// Forgot Password
router.post('/forgot-password', asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) throw createError('Email is required', 400);

  const userResult = await query('SELECT id FROM users WHERE email = ?', [email]);
  if (!userResult.rows || userResult.rows.length === 0) {
    return res.json({ success: true, message: 'If an account exists, a reset code has been sent.' });
  }

  const user = userResult.rows[0];
  const token = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
  const expires = new Date(Date.now() + 3600000); // 1 hour

  await query('UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?', [token, expires, user.id]);

  try {
    await emailService.sendPasswordResetEmail(email, token);
  } catch (error) {
    throw createError('Failed to send email', 500);
  }

  res.json({ success: true, message: 'Password reset code sent to your email' });
}));

// Reset Password
router.post('/reset-password', asyncHandler(async (req: Request, res: Response) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    throw createError('Email, code, and new password are required', 400);
  }

  const userResult = await query(
    'SELECT id FROM users WHERE email = ? AND reset_password_token = ? AND reset_password_expires > NOW()',
    [email, token]
  );

  if (!userResult.rows || userResult.rows.length === 0) {
    throw createError('Invalid or expired reset code', 400);
  }

  const userId = userResult.rows[0].id;
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await query(
    'UPDATE users SET password_hash = ?, password = NULL, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
    [hashedPassword, userId]
  );

  res.json({ success: true, message: 'Password reset successfully' });
}));

// Send OTP (Authenticated)
router.post('/send-otp', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  // Get user email
  const userResult = await query('SELECT email FROM users WHERE id = ?', [userId]);
  if (!userResult.rows || userResult.rows.length === 0) {
    throw createError('User not found', 404);
  }
  const email = userResult.rows[0].email;

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Save to DB (reusing reset_password_token columns for simplicity as they serve same "temp code" purpose)
  await query(
    'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
    [otp, expires, userId]
  );

  // Send Email
  try {
    await emailService.sendOtpEmail(email, otp, 'Security Verification');
  } catch (error) {
    console.error('Failed to send OTP email', error);
    throw createError('Failed to send OTP email', 500);
  }

  res.json({ success: true, message: 'OTP sent to your email' });
}));

// Verify OTP (Authenticated)
router.post('/verify-otp', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { otp } = req.body;
  const userId = req.user!.id;

  if (!otp) throw createError('OTP is required', 400);

  const userResult = await query(
    'SELECT id FROM users WHERE id = ? AND reset_password_token = ? AND reset_password_expires > NOW()',
    [userId, otp]
  );

  if (!userResult.rows || userResult.rows.length === 0) {
    throw createError('Invalid or expired OTP', 400);
  }

  // OTP Valid! 
  // We do NOT clear it immediately here on verify, purely so the subsequent action (if strict) could verify again.
  // But for this UI-gating flow, simply returning success is enough.

  res.json({ success: true, message: 'OTP verified successfully' });
}));

export default router;

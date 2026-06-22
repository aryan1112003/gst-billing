import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { createError } from './errorHandler';
import { query } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string | number;
    email: string;
    role: string;
    agencyId: number;
    accountType?: string;
    permissions: string[];
  };
  agencyId?: number | null;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Access token required', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;

      // Get user from database (note: agecny_id has typo in DB)
      const result = await query(
        `SELECT u.id, u.email, u.name, u.roleid, u.agecny_id, u.is_active, a.account_type
         FROM users u
         LEFT JOIN agencies a ON u.agecny_id = a.id
         WHERE u.id = ?`,
        [decoded.userId]
      );

      if (!result.rows || result.rows.length === 0) {
        throw createError('User not found', 401);
      }

      const user = result.rows[0];

      if (!user.is_active) {
        throw createError('Account is deactivated', 401);
      }

      // Map roleId to role name
      const roleMap: { [key: number]: string } = {
        1: 'admin',      // System Admin
        2: 'agency',     // Agency Admin
        3: 'user'        // Agency User
      };
      const roleName = roleMap[user.roleid] || 'user';

      req.user = {
        id: user.id,
        email: user.email,
        role: roleName,
        agencyId: user.agecny_id || null,
        accountType: user.account_type,
        permissions: [],
      };

      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        throw createError('Token expired', 401);
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        throw createError('Invalid token', 401);
      } else {
        throw jwtError;
      }
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (roles: string[] = [], permissions: string[] = []) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      // Check role-based access
      if (roles.length > 0 && !roles.includes(req.user.role)) {
        throw createError('Insufficient role permissions', 403);
      }

      // Check permission-based access
      if (permissions.length > 0) {
        const hasPermission = permissions.some(permission =>
          req.user!.permissions.includes(permission)
        );

        if (!hasPermission) {
          throw createError('Insufficient permissions', 403);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      if (!roles.includes(req.user.role)) {
        throw createError('Insufficient permissions. Admin access required.', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Optional authentication (doesn't throw error if no token)
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;

      const result = await query(
        `SELECT u.id, u.email, u.name, u.roleid, u.agecny_id, u.is_active, a.account_type
         FROM users u
         LEFT JOIN agencies a ON u.agecny_id = a.id
         WHERE u.id = ?`,
        [decoded.userId]
      );

      if (result.rows && result.rows.length > 0 && result.rows[0].is_active) {
        const user = result.rows[0];
        const roleMap2: { [key: number]: string } = { 1: 'admin', 2: 'agency', 3: 'user' };
        req.user = {
          id: user.id,
          email: user.email,
          role: roleMap2[user.roleid] || 'user',
          agencyId: user.agecny_id || null,
          accountType: user.account_type,
          permissions: [],
        };
      }
    } catch (jwtError) {
      // Ignore JWT errors for optional auth
    }

    next();
  } catch (error) {
    next(error);
  }
};
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Agency Filter Middleware
 * Adds agency filtering to queries based on user role
 * - System Admin (role='admin'): Can see all agencies' data
 * - Agency Users (role='agency' or 'user'): Can only see their agency's data
 */
export const agencyFilter = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next();
  }

  // System admin can see all data (no agency filter)
  if (req.user.role === 'admin') {
    req.agencyId = null;
  } else {
    // Agency admin and users can only see their agency's data
    req.agencyId = req.user.agencyId;
  }

  next();
};

/**
 * Helper function to add agency filter to WHERE clause
 */
export const addAgencyFilter = (
  whereClause: string,
  params: any[],
  agencyId: number | null,
  tableAlias: string = ''
): { whereClause: string; params: any[] } => {
  const prefix = tableAlias ? `${tableAlias}.` : '';
  
  // System admin sees all data
  if (agencyId === null) {
    return { whereClause, params };
  }

  // Add agency filter for non-admin users
  const newWhereClause = whereClause + ` AND ${prefix}agency_id = ?`;
  const newParams = [...params, agencyId];

  return { whereClause: newWhereClause, params: newParams };
};

// Extend AuthRequest to include agencyId
declare module 'express' {
  interface Request {
    agencyId?: number | null;
  }
}

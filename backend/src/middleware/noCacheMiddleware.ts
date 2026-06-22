import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to disable caching for API responses
 * This prevents 304 Not Modified responses and ensures fresh data
 */
export const noCacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Set headers to prevent caching
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  
  // Disable ETag generation (prevents 304 responses)
  res.removeHeader('ETag');
  
  next();
};

/**
 * Middleware to add CORS headers for all responses
 * This prevents 300-series redirect issues
 */
export const corsHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Get origin from request
  const origin = req.headers.origin;
  
  // Allow all origins in development
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

/**
 * Middleware to ensure JSON responses
 * This prevents content-type issues
 */
export const jsonResponseMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Set default content type
  res.type('application/json');
  
  next();
};

/**
 * Combined middleware for API routes
 */
export const apiMiddleware = [
  corsHeadersMiddleware,
  noCacheMiddleware,
  jsonResponseMiddleware,
];

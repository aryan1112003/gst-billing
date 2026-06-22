import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '8000'),
  env: process.env.NODE_ENV || 'development',

  // Database configuration (MySQL — default port 3306)
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    name: process.env.DB_NAME || 'mawebtec_lms',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
  },

  // JWT configuration — JWT_SECRET and JWT_REFRESH_SECRET must be set in .env for production
  jwt: {
    secret: process.env.JWT_SECRET
      || (process.env.NODE_ENV === 'production'
        ? (() => { throw new Error('JWT_SECRET environment variable is required in production'); })()
        : 'dev-super-secret-jwt-key-NOT-for-production'),
    refreshSecret: process.env.JWT_REFRESH_SECRET
      || (process.env.NODE_ENV === 'production'
        ? (() => { throw new Error('JWT_REFRESH_SECRET environment variable is required in production'); })()
        : 'dev-super-secret-refresh-key-NOT-for-production'),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:19006',
      'http://localhost:19000',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:3000'
    ],
  },

  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },

  // Email configuration is handled directly in emailService.ts via SMTP_* env vars.
  // See backend/.env for: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS,
  // SMTP_FROM_NAME, SMTP_FROM_EMAIL

  // Security configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10'), // Reduced from 12 to 10 for performance
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute (was 15 min)
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '1000'), // 1000 requests per minute (was 100 per 15 min)
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
};
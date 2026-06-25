import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './config/logger';
import { connectDatabase, checkDatabaseHealth } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { noCacheMiddleware } from './middleware/noCacheMiddleware';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import agencyRoutes from './routes/agencies';
import customerRoutes from './routes/customers';
import itemRoutes from './routes/items';
import invoiceRoutes from './routes/invoices';
import vendorRoutes from './routes/vendors';
import purchaseRoutes from './routes/purchases';
import paymentRoutes from './routes/payments';
import expenseRoutes from './routes/expenses';
import reportRoutes from './routes/reports';
import emailRoutes from './routes/email';
import gatePassRoutes from './routes/gatePasses';
import subscriptionRoutes from './routes/subscriptions';
import publicRoutes from './routes/public';
import healthRoutes from './routes/health';
import purchaseOrderRoutes from './routes/purchaseOrders';
import productionOrderRoutes from './routes/productionOrders';
import billOfMaterialsRoutes from './routes/billOfMaterials';
import recurringInvoiceRoutes from './routes/recurringInvoices';
import timeTrackingRoutes from './routes/timeTracking';
import projectRoutes from './routes/projects';
import tripSheetRoutes from './routes/tripSheets';
import fleetRoutes from './routes/fleet';
import batchTrackingRoutes from './routes/batchTracking';
import customsRoutes from './routes/customs';
import posRoutes from './routes/pos';

const app = express();

// Trust proxy - Important for getting correct origin
app.set('trust proxy', 1);

// CORS Configuration - MUST BE FIRST
// Dev: allow all origins. Production: allow whitelisted origins OR any origin
// sharing the same hostname as the backend (frontend on different port, same server).
const getAllowedHostnames = () =>
  config.cors.origin.map(o => { try { return new URL(o).hostname; } catch { return ''; } });

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Expo Go, etc.)
    if (!origin) return callback(null, true);
    // Allow all in development
    if (config.env !== 'production') return callback(null, true);
    // Exact match
    if (config.cors.origin.includes(origin)) return callback(null, true);
    // Same-server match: frontend on port 8081, backend on 8001 — same hostname
    try {
      const originHostname = new URL(origin).hostname;
      if (getAllowedHostnames().includes(originHostname)) return callback(null, true);
    } catch {}
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
}));


// Security middleware - AFTER CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// Rate limiting - Optimized for high traffic
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs, // From config
  max: config.security.rateLimitMax, // From config
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/';
  },
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Compression middleware
app.use(compression());

// Logging middleware - Enhanced
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Request logging middleware for debugging
app.use((req, res, next) => {
  logger.info(`📨 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// Simple health check endpoint (before other routes) - no database dependency
app.get('/health', (_req, res) => {
  console.log('Health endpoint called');
  try {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health endpoint error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Apply no-cache middleware to all API routes
app.use('/api/v1', noCacheMiddleware);

// Detailed health check under API v1 (after middleware) - includes database with timeout
app.get('/api/v1/health', async (_req, res) => {
  try {
    const healthPromise = import('./config/database').then(({ checkDatabaseHealth }) =>
      checkDatabaseHealth()
    );

    // Race between health check and timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Health check timeout')), 3000)
    );

    const health = await Promise.race([healthPromise, timeoutPromise]) as any;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: health?.postgres ? 'healthy' : 'unhealthy',
        cache: health?.redis ? 'healthy' : 'N/A',
      }
    });
  } catch (error) {
    res.json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: 'timeout',
        redis: 'timeout',
      },
      error: 'Database health check timed out'
    });
  }
});

// API routes
app.use('/api/v1/public', publicRoutes); // Public routes (no auth required)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/agencies', agencyRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/items', itemRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/purchases', purchaseRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/email', emailRoutes);
app.use('/api/v1/gate-passes', gatePassRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/purchase-orders', purchaseOrderRoutes);
app.use('/api/v1/production-orders', productionOrderRoutes);
app.use('/api/v1/bill-of-materials', billOfMaterialsRoutes);
app.use('/api/v1/recurring-invoices', recurringInvoiceRoutes);
app.use('/api/v1/time-tracking', timeTrackingRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/trip-sheets', tripSheetRoutes);
app.use('/api/v1/fleet', fleetRoutes);
app.use('/api/v1/batch-tracking', batchTrackingRoutes);
app.use('/api/v1/customs', customsRoutes);
app.use('/api/v1/pos', posRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'ERP Business Management API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
let httpServer: any;

const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  if (httpServer) {
    httpServer.close(() => {
      logger.info('HTTP server closed.');

      // Close database connections
      import('./config/database').then(({ disconnectDatabase }) => {
        disconnectDatabase().then(() => {
          logger.info('Database connections closed.');
          process.exit(0);
        });
      });
    });
  }

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    logger.info('Database connected, starting server...');

    // Start HTTP server
    httpServer = app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📊 Environment: ${config.env}`);
      logger.info(`🔗 API URL: http://localhost:${config.port}/api/v1`);
      logger.info(`❤️  Health Check: http://localhost:${config.port}/health`);
      logger.info(`🌐 CORS enabled for all origins in development mode`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return httpServer;

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
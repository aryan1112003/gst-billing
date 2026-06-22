import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../config/database';
import { logger } from '../config/logger';

const router = Router();

// Health check endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    const health = await checkDatabaseHealth();
    
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: health.mysql ? 'healthy' : 'unhealthy',
        redis: health.redis ? 'healthy' : 'unhealthy',
      },
    };

    // Return 200 if MySQL is healthy (Redis is optional)
    const statusCode = health.mysql ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);
    
  } catch (error) {
    logger.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

// Detailed health check
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const health = await checkDatabaseHealth();
    
    const detailedHealth = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
        external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100,
      },
      services: {
        database: {
          status: health.mysql ? 'healthy' : 'unhealthy',
          responseTime: health.mysqlResponseTime,
        },
        redis: {
          status: health.redis ? 'healthy' : 'unhealthy',
          responseTime: health.redisResponseTime,
        },
      },
    };

    const statusCode = health.mysql && health.redis ? 200 : 503;
    
    res.status(statusCode).json(detailedHealth);
    
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed',
    });
  }
});

export default router;
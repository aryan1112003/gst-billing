import { Pool, PoolClient } from 'pg';
import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

// PostgreSQL (Supabase) configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: { rejectUnauthorized: false },
  max: parseInt(process.env.DB_CONNECTION_LIMIT || '20'),
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
};

export const pool = new Pool(dbConfig);

// Redis Configuration (unchanged)
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
};

export const redisClient: RedisClientType = createClient({
  socket: {
    host: redisConfig.host,
    port: redisConfig.port,
  },
  password: redisConfig.password,
  database: redisConfig.db,
});

export const connectDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('✅ PostgreSQL (Supabase) connected successfully');

    try {
      await redisClient.connect();
      logger.info('✅ Redis connected successfully');
    } catch {
      logger.warn('⚠️  Redis connection failed - continuing without caching');
    }
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await pool.end();
    if (redisClient.isOpen) await redisClient.quit();
    logger.info('🔌 Database connections closed');
  } catch (error) {
    logger.error('❌ Error closing database connections:', error);
  }
};

export const checkDatabaseHealth = async (): Promise<{
  mysql: boolean; redis: boolean; mysqlResponseTime?: number; redisResponseTime?: number
}> => {
  const health = { mysql: false, redis: false, mysqlResponseTime: 0, redisResponseTime: 0 };

  try {
    const start = Date.now();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    health.mysql = true;
    health.mysqlResponseTime = Date.now() - start;
  } catch (error) {
    logger.error('PostgreSQL health check failed:', error);
  }

  try {
    if (redisClient.isOpen) {
      const start = Date.now();
      await redisClient.ping();
      health.redis = true;
      health.redisResponseTime = Date.now() - start;
    }
  } catch (error) {
    logger.error('Redis health check failed:', error);
  }

  return health;
};

// Convert MySQL ? placeholders to PostgreSQL $N and auto-add RETURNING * for INSERTs
export function prepareQuery(text: string, params?: any[]): { text: string; params: any[] } {
  let processedText = text;

  // If query uses $N style already (PostgreSQL) convert any $N back from the old MySQL adapter
  // and if it uses ? style (MySQL) convert to $N
  if (text.includes('?')) {
    let n = 0;
    processedText = text.replace(/\?/g, () => `$${++n}`);
  }

  // Auto-add RETURNING * to INSERT so callers can read insertId from result.rows[0].id
  const upper = processedText.trimStart().toUpperCase();
  if (upper.startsWith('INSERT') && !upper.includes('RETURNING')) {
    processedText = processedText.trimEnd() + ' RETURNING *';
  }

  return { text: processedText, params: params || [] };
}

// Main query helper — keeps the same interface all routes expect:
// returns { rows, rowCount, insertId, affectedRows }
export const query = async (text: string, params?: any[], _agencyDbName?: string): Promise<any> => {
  const start = Date.now();
  try {
    const prepared = prepareQuery(text, params);
    const result = await pool.query(prepared.text, prepared.params);
    const duration = Date.now() - start;

    logger.debug('Executed query', { text: prepared.text, duration, rows: result.rowCount });

    return {
      rows: result.rows,
      rowCount: result.rowCount ?? 0,
      insertId: result.rows?.[0]?.id ?? null,
      affectedRows: result.rowCount ?? 0,
    };
  } catch (error) {
    logger.error('Database query error:', { text, error });
    throw error;
  }
};

// Agency query — same pool (Supabase is a single database, filtering done via agency_id column)
export const agencyQuery = async (_agencyId: number, text: string, params?: any[]): Promise<any> => {
  return query(text, params);
};

// Transaction helper — acquires a dedicated PoolClient so all queries run on the same connection
export const withTransaction = async <T>(fn: (clientQuery: typeof query) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const clientQuery = async (text: string, params?: any[]): Promise<any> => {
      const prepared = prepareQuery(text, params);
      const result = await client.query(prepared.text, prepared.params);
      return {
        rows: result.rows,
        rowCount: result.rowCount ?? 0,
        insertId: result.rows?.[0]?.id ?? null,
        affectedRows: result.rowCount ?? 0,
      };
    };
    const result = await fn(clientQuery);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Redis helpers (unchanged)
export const setCache = async (key: string, value: any, expireInSeconds?: number): Promise<void> => {
  try {
    const serializedValue = JSON.stringify(value);
    if (expireInSeconds) {
      await redisClient.setEx(key, expireInSeconds, serializedValue);
    } else {
      await redisClient.set(key, serializedValue);
    }
  } catch (error) {
    logger.error('Redis set error:', { key, error });
    throw error;
  }
};

export const getCache = async (key: string): Promise<any> => {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Redis get error:', { key, error });
    return null;
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error('Redis delete error:', { key, error });
  }
};

export const clearCachePattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) await redisClient.del(keys);
  } catch (error) {
    logger.error('Redis clear pattern error:', { pattern, error });
  }
};

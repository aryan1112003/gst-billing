import { Pool, PoolClient } from 'pg';
import { config } from '../config';
import { prepareQuery } from '../config/database';

// Wraps a pg PoolClient to look like a mysql2 Connection
// so that agencyService.ts / routes that call getConnection() keep working
class PgConnectionWrapper {
  constructor(private client: PoolClient) {}

  async beginTransaction() {
    await this.client.query('BEGIN');
  }

  async commit() {
    await this.client.query('COMMIT');
  }

  async rollback() {
    await this.client.query('ROLLBACK');
  }

  release() {
    this.client.release();
  }

  // Returns [rows, []] for SELECT, [{ insertId, affectedRows }, []] for DML
  async query(sql: string, params?: any[]): Promise<any[]> {
    const prepared = prepareQuery(sql, params);
    const result = await this.client.query(prepared.text, prepared.params);

    const upper = sql.trimStart().toUpperCase();
    if (upper.startsWith('SELECT') || upper.startsWith('SHOW')) {
      return [result.rows, []];
    }
    return [{ insertId: result.rows?.[0]?.id ?? null, affectedRows: result.rowCount ?? 0 }, []];
  }
}

// Wraps a pg Pool to look like a mysql2 Pool
class PgPoolWrapper {
  constructor(private pgPool: Pool) {}

  async getConnection(): Promise<PgConnectionWrapper> {
    const client = await this.pgPool.connect();
    return new PgConnectionWrapper(client);
  }

  // Returns [rows, []] for SELECT, [{ insertId, affectedRows }, []] for DML
  async query(sql: string, params?: any[]): Promise<any[]> {
    const prepared = prepareQuery(sql, params);
    const result = await this.pgPool.query(prepared.text, prepared.params);

    const upper = sql.trimStart().toUpperCase();
    if (upper.startsWith('SELECT') || upper.startsWith('SHOW')) {
      return [result.rows, []];
    }
    return [{ insertId: result.rows?.[0]?.id ?? null, affectedRows: result.rowCount ?? 0 }, []];
  }

  async end() {
    await this.pgPool.end();
  }
}

class DatabaseConnectionManager {
  private pgPool: Pool;
  private masterPoolWrapper: PgPoolWrapper;

  constructor() {
    this.pgPool = new Pool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 10000,
    });

    this.masterPoolWrapper = new PgPoolWrapper(this.pgPool);
  }

  getMasterPool(): PgPoolWrapper {
    return this.masterPoolWrapper;
  }

  // In Supabase there is only one database, so all agency queries go to the same pool
  async getAgencyPool(_agencyDbName: string): Promise<PgPoolWrapper> {
    return this.masterPoolWrapper;
  }

  // No-op in Supabase — we can't create separate databases
  async createAgencyDatabase(_agencyId: number, _companyName: string): Promise<string> {
    return 'supabase_shared';
  }

  async agencyDatabaseExists(_dbName: string): Promise<boolean> {
    return true;
  }

  async closeAll(): Promise<void> {
    await this.pgPool.end();
  }
}

export const dbConnectionManager = new DatabaseConnectionManager();
export default dbConnectionManager;

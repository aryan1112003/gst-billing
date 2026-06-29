import { query } from '../config/database';
import { logger } from '../config/logger';
import { AuditLog } from '../types';

export class AuditService {
  static async logAction(
    userId: string | undefined,
    tableName: string,
    recordId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValues?: any,
    newValues?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO audit_logs (user_id, table_name, record_id, action, old_values, new_values, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId || null,
          tableName,
          recordId,
          action,
          oldValues ? JSON.stringify(oldValues) : null,
          newValues ? JSON.stringify(newValues) : null,
          ipAddress || null,
          userAgent || null,
        ]
      );
    } catch (error) {
      logger.error('Failed to log audit action:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  static async getAuditLogs(
    tableName?: string,
    recordId?: string,
    userId?: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (tableName) {
      paramCount++;
      whereClause += ` AND table_name = $${paramCount}`;
      params.push(tableName);
    }

    if (recordId) {
      paramCount++;
      whereClause += ` AND record_id = $${paramCount}`;
      params.push(recordId);
    }

    if (userId) {
      paramCount++;
      whereClause += ` AND user_id = $${paramCount}`;
      params.push(userId);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM audit_logs ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0].count);

    // Get logs with user information
    const logsResult = await query(
      `SELECT al.*, u.name as user_name, u.email as user_email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereClause}
       ORDER BY al.created_date DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset]
    );

    const logs = logsResult.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      user: row.user_name ? {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
      } : undefined,
      tableName: row.table_name,
      recordId: row.record_id,
      action: row.action,
      oldValues: row.old_values,
      newValues: row.new_values,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_date,
    }));

    return { logs, total };
  }

  static async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const result = await query(
      `DELETE FROM audit_logs WHERE created_date < NOW() - INTERVAL '${daysToKeep} days'`
    );

    const deletedCount = result.rowCount || 0;
    logger.info(`Cleaned up ${deletedCount} old audit logs`);

    return deletedCount;
  }
}

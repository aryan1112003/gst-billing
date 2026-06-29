import { query } from '../config/database';
import { logger } from '../config/logger';
import { StockMovement } from '../types';

export class StockService {
  static async recordMovement(
    itemId: string,
    movementType: 'in' | 'out' | 'adjustment',
    quantity: number,
    referenceType?: string,
    referenceId?: string,
    notes?: string
  ): Promise<void> {
    const client = await query('START TRANSACTION');
    
    try {
      // Record stock movement
      await query(
        `INSERT INTO stock_movements (item_id, movement_type, quantity, reference_type, reference_id, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [itemId, movementType, quantity, referenceType, referenceId, notes]
      );

      // Update item stock
      const stockChange = movementType === 'out' ? -quantity : quantity;
      await query(
        `UPDATE items SET current_stock = current_stock + ? WHERE id = ?`,
        [stockChange, itemId]
      );

      await query('COMMIT');
      
      logger.info('Stock movement recorded', {
        itemId,
        movementType,
        quantity,
        referenceType,
        referenceId,
      });
    } catch (error) {
      await query('ROLLBACK');
      logger.error('Failed to record stock movement:', error);
      throw error;
    }
  }

  static async getMovements(
    itemId?: string,
    movementType?: string,
    fromDate?: Date,
    toDate?: Date,
    page: number = 1,
    limit: number = 50
  ): Promise<{ movements: StockMovement[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (itemId) {
      paramCount++;
      whereClause += ` AND sm.item_id = $${paramCount}`;
      params.push(itemId);
    }

    if (movementType) {
      paramCount++;
      whereClause += ` AND sm.movement_type = $${paramCount}`;
      params.push(movementType);
    }

    if (fromDate) {
      paramCount++;
      whereClause += ` AND sm.created_date >= $${paramCount}`;
      params.push(fromDate);
    }

    if (toDate) {
      paramCount++;
      whereClause += ` AND sm.created_date <= $${paramCount}`;
      params.push(toDate);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM stock_movements sm ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0].count);

    // Get movements with item information
    const movementsResult = await query(
      `SELECT sm.*, i.name as item_name, i.sku as item_sku
       FROM stock_movements sm
       JOIN items i ON sm.item_id = i.id
       ${whereClause}
       ORDER BY sm.created_date DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset]
    );

    const movements = movementsResult.map((row: any) => ({
      id: row.id,
      itemId: row.item_id,
      item: {
        id: row.item_id,
        name: row.item_name,
        sku: row.item_sku,
      },
      movementType: row.movement_type,
      quantity: row.quantity,
      referenceType: row.reference_type,
      referenceId: row.reference_id,
      notes: row.notes,
      createdAt: row.created_date,
    }));

    return { movements, total };
  }

  static async getLowStockItems(threshold?: number): Promise<any[]> {
    const result = await query(
      `SELECT id, sku, name, current_stock, reorder_level
       FROM items
       WHERE is_active = true
       AND current_stock <= COALESCE(?, reorder_level)
       ORDER BY current_stock ASC`,
      [threshold]
    );

    return result;
  }

  static async getStockSummary(): Promise<{
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalStockValue: number;
  }> {
    const summaryResult = await query(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN current_stock <= reorder_level THEN 1 END) as low_stock_items,
        COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock_items,
        COALESCE(SUM(current_stock * unit_price), 0) as total_stock_value
      FROM items
      WHERE is_active = true
    `);

    const summary = summaryResult[0];
    return {
      totalItems: parseInt(summary.total_items),
      lowStockItems: parseInt(summary.low_stock_items),
      outOfStockItems: parseInt(summary.out_of_stock_items),
      totalStockValue: parseFloat(summary.total_stock_value),
    };
  }

  static async adjustStock(
    itemId: string,
    newQuantity: number,
    reason: string,
    userId?: string
  ): Promise<void> {
    const client = await query('START TRANSACTION');
    
    try {
      // Get current stock
      const itemResult = await query(
        'SELECT current_stock FROM items WHERE id = ?',
        [itemId]
      );

      if (itemResult.length === 0) {
        throw new Error('Item not found');
      }

      const currentStock = itemResult[0].current_stock;
      const adjustment = newQuantity - currentStock;

      if (adjustment !== 0) {
        // Record stock movement
        await this.recordMovement(
          itemId,
          'adjustment',
          Math.abs(adjustment),
          'adjustment',
          undefined,
          `Stock adjustment: ${reason}. Previous: ${currentStock}, New: ${newQuantity}`
        );
      }

      await query('COMMIT');
      
      logger.info('Stock adjusted', {
        itemId,
        previousStock: currentStock,
        newStock: newQuantity,
        adjustment,
        reason,
        userId,
      });
    } catch (error) {
      await query('ROLLBACK');
      logger.error('Failed to adjust stock:', error);
      throw error;
    }
  }
}

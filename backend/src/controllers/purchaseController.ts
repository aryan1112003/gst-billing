import { Request, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { addAgencyFilter } from '../middleware/agencyFilter';
import { AuditService } from '../services/auditService';
import { generatePurchaseNumber } from '../utils/helpers';
import { logger } from '../config/logger';
import { pdfService } from '../services/pdfService';
import { emailService } from '../services/emailService';

export class PurchaseController {
  static getPurchases = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { search, page = 1, limit = 10, vendorId, status, fromDate, toDate } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE p.is_deleted = 0';
    let params: any[] = [];

    // Add agency filter
    const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null, 'p');
    whereClause = filtered.whereClause;
    params = filtered.params;

    if (search) {
      whereClause += ` AND (CAST(p.id AS TEXT) LIKE ? OR v.vendor_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (vendorId) {
      whereClause += ` AND p.vendor_id = ?`;
      params.push(vendorId);
    }

    if (status) {
      whereClause += ` AND p.status = ?`;
      params.push(status);
    }

    if (fromDate) {
      whereClause += ` AND p.date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      whereClause += ` AND p.date <= ?`;
      params.push(toDate);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM purchase p LEFT JOIN vendors v ON p.vendor_id = v.id ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? 0);

    // Get purchases with item count
    const purchasesResult = await query(
      `SELECT p.*,
              COALESCE(NULLIF(TRIM(p.vendor_name),''), v.vendor_name) AS resolved_vendor_name,
              COALESCE(NULLIF(TRIM(p.vendor_email),''), v.vendor_email) AS resolved_vendor_email,
              COUNT(pi.id) AS items_count
       FROM purchase p
       LEFT JOIN vendors v ON p.vendor_id = v.id
       LEFT JOIN purchase_items pi ON pi.purchase_id = p.id
       ${whereClause}
       GROUP BY p.id, v.vendor_name, v.vendor_email
       ORDER BY p.created_date DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    const purchases = purchasesResult.rows.map((row: any) => ({
      id: row.id,
      purchaseNumber: ('PO-' + String(row.id).padStart(4,'0')),
      vendorId: row.vendor_id,
      vendorName: row.resolved_vendor_name || row.vendor_name || '',
      vendor: {
        id: row.vendor_id,
        name: row.resolved_vendor_name || row.vendor_name,
        email: row.resolved_vendor_email || row.vendor_email,
      },
      vendor_name: row.resolved_vendor_name || row.vendor_name,
      vendor_email: row.resolved_vendor_email || row.vendor_email,
      purchaseDate: row.date,
      itemsCount: parseInt(row.items_count ?? 0),
      subtotal: parseFloat(row.sub_total ?? 0),
      taxAmount: parseFloat(row.tax_amount ?? 0),
      totalAmount: parseFloat(row.total_amount ?? 0),
      status: row.status,
      notes: row.notes,
      createdAt: row.created_date,
      updatedAt: row.updated_date,
    }));

    res.json({
      success: true,
      data: {
        purchases,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  });

  static getPurchase = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    let whereClause = 'WHERE p.id = ? AND p.is_deleted = 0';
    let params: any[] = [id];

    // Add agency filter
    const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null, 'p');
    whereClause = filtered.whereClause;
    params = filtered.params;

    // Get purchase with vendor details
    const purchaseResult = await query(
      `SELECT p.*,
              v.vendor_name,
              v.vendor_email,
              COALESCE(v.vendor_phone, v.vendor_mobile) as vendor_phone,
              v.address as vendor_address
       FROM purchase p
       LEFT JOIN vendors v ON p.customer_id = v.id
       ${whereClause}`,
      params
    );

    if (purchaseResult.rows.length === 0) {
      throw createError('Purchase order not found', 404);
    }

    const purchaseRow = purchaseResult.rows[0];

    // Get line items from purchase_items table
    const lineItemsResult = await query(
      `SELECT pi.*, i.hsn_code as item_hsn
       FROM purchase_items pi
       LEFT JOIN items i ON pi.item_id = i.id
       WHERE pi.purchase_id = ?
       ORDER BY pi.id ASC`,
      [id]
    );

    const lineItems = lineItemsResult.rows.map((item: any, index: number) => ({
      id: item.id || index + 1,
      itemId: item.item_id,
      item: {
        id: item.item_id,
        name: item.item_name || '',
        sku: item.hsn_sac || item.item_hsn || '',
      },
      quantity: parseFloat(item.quantity ?? 0),
      unitPrice: parseFloat(item.unit_price ?? 0),
      discount: parseFloat(item.discount_percent ?? 0),
      taxRate: parseFloat(item.tax_rate ?? 0),
      description: item.description || '',
      hsnSac: item.hsn_sac || '',
      total: parseFloat(item.amount ?? 0),
    }));

    const purchase = {
      id: purchaseRow.id,
      purchaseNumber: ('PO-' + String(purchaseRow.id).padStart(4,'0')),
      vendorId: purchaseRow.customer_id,
      vendor: {
        id: purchaseRow.customer_id,
        name: purchaseRow.vendor_name,
        email: purchaseRow.vendor_email,
        phone: purchaseRow.vendor_phone,
        address: purchaseRow.vendor_address,
      },
      purchaseDate: purchaseRow.date,
      subtotal: parseFloat(purchaseRow.sub_total ?? 0),
      taxAmount: parseFloat(purchaseRow.tax_amount ?? 0),
      totalAmount: parseFloat(purchaseRow.total_amount ?? 0),
      status: purchaseRow.status,
      notes: purchaseRow.notes,
      lineItems,
      createdAt: purchaseRow.created_date,
      updatedAt: purchaseRow.updated_date,
    };

    res.json({
      success: true,
      data: { purchase }
    });
  });

  static downloadPDF = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Get purchase data
    const purchaseResponse = await PurchaseController.getPurchaseData(id, req.agencyId ?? null);

    if (!purchaseResponse) {
      throw createError('Purchase order not found', 404);
    }

    // Generate PDF
    const pdfBuffer = await pdfService.generatePurchasePDF(purchaseResponse);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=purchase-${purchaseResponse.purchaseNumber}.pdf`);
    res.send(pdfBuffer);
  });

  static sendEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { to, cc, subject, message } = req.body;

    // Get purchase data
    const purchase = await PurchaseController.getPurchaseData(id, req.agencyId ?? null);

    if (!purchase) {
      throw createError('Purchase order not found', 404);
    }

    // Generate PDF
    const pdfBuffer = await pdfService.generatePurchasePDF(purchase);

    // Send email
    await emailService.sendPurchaseEmail({
      to,
      cc,
      subject: subject || `Purchase Order ${purchase.purchaseNumber}`,
      message: message || `Please find attached purchase order ${purchase.purchaseNumber}.`,
      purchaseNumber: purchase.purchaseNumber,
      vendorName: purchase.vendor.name,
      totalAmount: purchase.totalAmount,
      pdfBuffer,
    });

    res.json({
      success: true,
      message: 'Purchase order sent successfully'
    });
  });

  // Helper method to get purchase data
  private static async getPurchaseData(id: string, agencyId: number | null) {
    let whereClause = 'WHERE p.id = ? AND p.is_deleted = 0';
    let params: any[] = [id];

    const filtered = addAgencyFilter(whereClause, params, agencyId, 'p');
    whereClause = filtered.whereClause;
    params = filtered.params;

    const purchaseResult = await query(
      `SELECT p.*,
              v.vendor_name,
              v.vendor_email,
              COALESCE(v.vendor_phone, v.vendor_mobile) as vendor_phone,
              v.address as vendor_address
       FROM purchase p
       LEFT JOIN vendors v ON p.customer_id = v.id
       ${whereClause}`,
      params
    );

    if (purchaseResult.rows.length === 0) {
      return null;
    }

    const purchaseRow = purchaseResult.rows[0];

    // Get line items from purchase_items table
    const lineItemsResult = await query(
      `SELECT pi.*, i.hsn_code as item_hsn
       FROM purchase_items pi
       LEFT JOIN items i ON pi.item_id = i.id
       WHERE pi.purchase_id = ?
       ORDER BY pi.id ASC`,
      [id]
    );

    const lineItems = lineItemsResult.rows.map((item: any) => ({
      description: item.description || item.item_name || '',
      hsnSac: item.hsn_sac || item.item_hsn || '',
      quantity: parseFloat(item.quantity ?? 0),
      unitPrice: parseFloat(item.unit_price ?? 0),
      discount: parseFloat(item.discount_percent ?? 0),
      taxRate: parseFloat(item.tax_rate ?? 0),
      total: parseFloat(item.amount ?? 0),
    }));

    return {
      id: purchaseRow.id,
      purchaseNumber: ('PO-' + String(purchaseRow.id).padStart(4,'0')),
      vendor: {
        name: purchaseRow.vendor_name,
        email: purchaseRow.vendor_email,
        phone: purchaseRow.vendor_phone,
        address: purchaseRow.vendor_address,
      },
      purchaseDate: purchaseRow.date,
      subtotal: parseFloat(purchaseRow.sub_total ?? 0),
      taxAmount: parseFloat(purchaseRow.tax_amount ?? 0),
      totalAmount: parseFloat(purchaseRow.total_amount ?? 0),
      notes: purchaseRow.notes,
      lineItems,
    };
  }
}





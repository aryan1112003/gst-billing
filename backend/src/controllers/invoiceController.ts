import { Request, Response } from 'express';
import { query, withTransaction } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { addAgencyFilter } from '../middleware/agencyFilter';
import { AuditService } from '../services/auditService';
import { logger } from '../config/logger';

export class InvoiceController {
  static getInvoices = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { search, page = 1, limit = 10, customerId, status, fromDate, toDate, type = 'invoice' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE i.is_deleted = 0';
    let params: any[] = [];

    // Add agency filter
    const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null, 'i');
    whereClause = filtered.whereClause;
    params = filtered.params;

    if (search) {
      whereClause += ` AND (i.invoice_number ILIKE ? OR CONCAT(c.fname, ' ', c.lname) ILIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (customerId) {
      whereClause += ` AND i.customer_id = ?`;
      params.push(customerId);
    }

    if (status) {
      whereClause += ` AND i.status = ?`;
      params.push(status);
    }

    if (fromDate) {
      whereClause += ` AND i.invoice_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      whereClause += ` AND i.invoice_date <= ?`;
      params.push(toDate);
    }

    if (type) {
      whereClause += ` AND i.type = ?`;
      params.push(type);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM invoices i JOIN customers c ON i.customer_id = c.id ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? 0);

    // Get invoices
    const invoicesResult = await query(
      `SELECT i.*,
              CONCAT(c.fname, ' ', c.lname) as customer_name,
              c.customer_email as customer_email
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       ${whereClause}
       ORDER BY i.created_date DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    const invoices = invoicesResult.rows.map((row: any) => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      customerId: row.customer_id,
      customer: {
        id: row.customer_id,
        name: row.customer_name,
        email: row.customer_email,
      },
      issueDate: row.invoice_date,
      dueDate: row.due_date,
      subtotal: parseFloat(row.subtotal ?? 0),
      taxAmount: parseFloat(row.tax_amount ?? 0),
      discountAmount: parseFloat(row.discount_amount ?? 0),
      totalAmount: parseFloat(row.total_amount ?? 0),
      paidAmount: parseFloat(row.paid_amount ?? 0),
      balanceAmount: parseFloat(row.balance_amount ?? 0),
      status: row.status,
      notes: row.customer_notes,
      createdAt: row.created_date,
      updatedAt: row.updated_date,
      type: row.type || 'invoice',
    }));

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  });

  static getInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    let whereClause = 'WHERE i.id = ? AND i.is_deleted = 0';
    let params: any[] = [id];

    // Add agency filter
    const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null, 'i');
    whereClause = filtered.whereClause;
    params = filtered.params;

    // Get invoice with customer details
    const invoiceResult = await query(
      `SELECT i.*,
              CONCAT(c.fname, ' ', c.lname) as customer_name,
              c.customer_email as customer_email,
              COALESCE(c.cwork_phone, c.cmobile_phone) as customer_phone,
              c.company_name as customer_company
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       ${whereClause}`,
      params
    );

    if (invoiceResult.rows.length === 0) {
      throw createError('Invoice not found', 404);
    }

    const invoiceRow = invoiceResult.rows[0];

    // Fetch line items from invoice_items table
    let lineItems: any[] = [];
    try {
      const itemsResult = await query(
        `SELECT ii.*, i.hsncode as item_hsn_code
         FROM invoice_items ii
         LEFT JOIN items i ON ii.item_id = i.id
         WHERE ii.invoice_id = ?
         ORDER BY ii.id ASC`,
        [invoiceRow.id]
      );
      lineItems = itemsResult.rows.map((item: any) => ({
        id:              item.id,
        itemId:          item.item_id,
        item:            item.item_id ? { id: item.item_id, name: item.item_name || '', sku: '', unit: item.unit || 'pcs', hsnCode: item.item_hsn_code || '' } : null,
        itemName:        item.item_name || '',
        description:     item.description || '',
        quantity:        parseFloat(item.quantity ?? 0),
        unit:            item.unit || 'pcs',
        unitPrice:       parseFloat(item.rate ?? 0),
        discountPercent: parseFloat(item.discount_percent ?? 0),
        taxRate:         parseFloat(item.tax_rate ?? 0),
        total:           parseFloat(item.amount ?? 0),
      }));
    } catch {
      lineItems = [];
    }

    const invoice = {
      id: invoiceRow.id,
      invoiceNumber: invoiceRow.invoice_number,
      customerId: invoiceRow.customer_id,
      customer: {
        id: invoiceRow.customer_id,
        name: invoiceRow.customer_name,
        email: invoiceRow.customer_email,
        phone: invoiceRow.customer_phone,
        company: invoiceRow.customer_company,
      },
      issueDate: invoiceRow.invoice_date,
      dueDate: invoiceRow.due_date,
      paymentTerms: invoiceRow.payment_terms,
      subject: invoiceRow.subject,
      subtotal: parseFloat(invoiceRow.subtotal ?? 0),
      taxAmount: parseFloat(invoiceRow.tax_amount ?? 0),
      discountAmount: parseFloat(invoiceRow.discount_amount ?? 0),
      totalAmount: parseFloat(invoiceRow.total_amount ?? 0),
      paidAmount: parseFloat(invoiceRow.paid_amount ?? 0),
      balanceAmount: parseFloat(invoiceRow.balance_amount ?? 0),
      status: invoiceRow.status,
      notes: invoiceRow.customer_notes,
      termsConditions: invoiceRow.terms_conditions,
      lineItems,
      createdAt: invoiceRow.created_date,
      updatedAt: invoiceRow.updated_date,
      type: invoiceRow.type || 'invoice',
    };

    res.json({
      success: true,
      data: { invoice },
    });
  });

  static createInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      customerId,
      issueDate,
      dueDate,
      paymentTerms,
      subject,
      discountAmount = 0,
      notes,
      termsConditions,
      lineItems,
      type = 'invoice',
    } = req.body;

    // Validate required fields
    if (!customerId) throw createError('Customer is required', 400);
    if (!issueDate) throw createError('Issue date is required', 400);

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      throw createError('At least one line item is required to create an invoice.', 400);
    }

    // Validate customer exists in same agency
    let whereClause = 'WHERE id = ?';
    let customerParams: any[] = [customerId];
    const customerFiltered = addAgencyFilter(whereClause, customerParams, req.agencyId ?? null);
    const customerResult = await query(
      `SELECT id FROM customers ${customerFiltered.whereClause}`,
      customerFiltered.params
    );
    if (customerResult.rows.length === 0) {
      throw createError('Customer not found', 400);
    }

    // Calculate totals from line items
    let subtotal = 0;
    let taxAmount = 0;
    const processedLineItems = lineItems.map((item: any) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.unitPrice) || 0;
      const discountPct = parseFloat(item.discountPercent) || 0;
      const taxRate = parseFloat(item.taxRate) || 0;

      const lineTotal = qty * rate * (1 - discountPct / 100);
      const lineTax = lineTotal * (taxRate / 100);
      subtotal += lineTotal;
      taxAmount += lineTax;

      return {
        item_id: item.itemId || null,
        item_name: item.itemName || item.description || 'Item',
        description: item.description || '',
        quantity: qty,
        unit: item.unit || 'pcs',
        rate,
        discount_percent: discountPct,
        tax_rate: taxRate,
        amount: parseFloat((lineTotal + lineTax).toFixed(2)),
      };
    });

    const totalAmount = parseFloat((subtotal + taxAmount - parseFloat(String(discountAmount))).toFixed(2));

    // Get user's agency_id
    const agencyId = req.agencyId ?? req.user?.agencyId ?? null;

    // Generate invoice number from settings
    const { agencyService } = await import('../services/agencyService');
    const settings = await agencyService.getAgencySettings(agencyId!);

    let invoiceNumber: string;
    let nextNumKey = '';
    let currentNextNumber = 1;

    switch (type) {
      case 'quotation':
        currentNextNumber = parseInt(settings.quotation_next_number || '1');
        invoiceNumber = `${settings.quotation_prefix || 'QUO'}-${currentNextNumber.toString().padStart(4, '0')}`;
        nextNumKey = 'quotation_next_number';
        break;
      case 'challan':
        currentNextNumber = parseInt(settings.challan_next_number || '1');
        invoiceNumber = `${settings.challan_prefix || 'DC'}-${currentNextNumber.toString().padStart(4, '0')}`;
        nextNumKey = 'challan_next_number';
        break;
      default:
        currentNextNumber = parseInt(settings.invoice_next_number || '1');
        invoiceNumber = `${settings.invoice_prefix || 'INV'}-${currentNextNumber.toString().padStart(4, '0')}`;
        nextNumKey = 'invoice_next_number';
    }

    const invoiceId = await withTransaction(async (tq) => {
      const invoiceResult = await tq(
        `INSERT INTO invoices (
          customer_id,
          invoice_number, invoice_date, due_date, payment_terms, subject,
          subtotal, discount_amount, tax_amount, total_amount,
          type, status,
          customer_notes, terms_conditions, agency_id,
          created_by, updated_by, created_date, updated_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          customerId, invoiceNumber, issueDate, dueDate || issueDate,
          paymentTerms || null, subject || null,
          subtotal.toFixed(2), parseFloat(String(discountAmount)).toFixed(2),
          taxAmount.toFixed(2), totalAmount.toFixed(2), type,
          notes || null, termsConditions || null,
          agencyId,
          req.user?.id || 1, req.user?.id || 1,
        ]
      );

      const newInvoiceId = invoiceResult.insertId;

      for (const li of processedLineItems) {
        await tq(
          `INSERT INTO invoice_items
             (invoice_id, item_id, item_name, description, quantity, unit, rate, discount_percent, tax_rate, amount)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newInvoiceId, li.item_id, li.item_name, li.description, li.quantity, li.unit, li.rate, li.discount_percent, li.tax_rate, li.amount]
        );
      }

      return newInvoiceId;
    });

    // Increment document number in settings
    if (nextNumKey) {
      try {
        await agencyService.updateAgencySettings(agencyId!, {
          [nextNumKey]: (currentNextNumber + 1).toString(),
        });
      } catch (settingsError) {
        logger.warn('Failed to increment document number in settings', { settingsError });
      }
    }

    const invoiceData = await query('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    const invoice = invoiceData.rows[0];

    await AuditService.logAction(
      req.user?.id ? String(req.user.id) : undefined,
      'invoices', invoice.id, 'CREATE', null, invoice,
      req.ip, req.get('User-Agent')
    );

    logger.info('Invoice created', { invoiceId: invoice.id, invoiceNumber, userId: req.user?.id });

    res.status(201).json({
      success: true,
      data: { invoice },
    });
  });

  static updateInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { customerId, issueDate, dueDate, discountAmount, status, notes, lineItems } = req.body;

    // Get existing invoice with agency filter
    let whereClause = 'WHERE id = ? AND is_deleted = 0';
    let params: any[] = [id];
    const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);

    const existingResult = await query(`SELECT * FROM invoices ${filtered.whereClause}`, filtered.params);
    if (existingResult.rows.length === 0) {
      throw createError('Invoice not found', 404);
    }

    const existingInvoice = existingResult.rows[0];

    // Don't allow updates to paid or cancelled invoices
    if (existingInvoice.status === 'paid') {
      throw createError('Cannot update a paid invoice', 400);
    }
    if (existingInvoice.status === 'cancelled') {
      throw createError('Cannot update a cancelled invoice', 400);
    }

    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let newLineItems: any[] | null = null;

    if (customerId) { updateFields.push('customer_id = ?'); updateParams.push(customerId); }
    if (issueDate) { updateFields.push('invoice_date = ?'); updateParams.push(issueDate); }
    if (dueDate !== undefined) { updateFields.push('due_date = ?'); updateParams.push(dueDate || null); }
    if (discountAmount !== undefined) { updateFields.push('discount_amount = ?'); updateParams.push(discountAmount); }
    if (status) { updateFields.push('status = ?'); updateParams.push(status); }
    if (notes !== undefined) { updateFields.push('customer_notes = ?'); updateParams.push(notes); }

    if (Array.isArray(lineItems) && lineItems.length > 0) {
      let subtotal = 0;
      let taxAmount = 0;
      const processedLineItems = lineItems.map((item: any) => {
        const qty = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.unitPrice) || 0;
        const discountPct = parseFloat(item.discountPercent) || 0;
        const taxRate = parseFloat(item.taxRate) || 0;
        const lineTotal = qty * rate * (1 - discountPct / 100);
        const lineTax = lineTotal * (taxRate / 100);
        subtotal += lineTotal;
        taxAmount += lineTax;
        return {
          item_id: item.itemId || null,
          item_name: item.itemName || item.description || 'Item',
          description: item.description || '',
          quantity: qty, unit: item.unit || 'pcs', rate,
          discount_percent: discountPct, tax_rate: taxRate,
          amount: parseFloat((lineTotal + lineTax).toFixed(2)),
        };
      });

      const effectiveDiscount = discountAmount !== undefined ? parseFloat(String(discountAmount)) : parseFloat(existingInvoice.discount_amount ?? 0);
      const totalAmount = parseFloat((subtotal + taxAmount - effectiveDiscount).toFixed(2));
      updateFields.push('subtotal = ?', 'tax_amount = ?', 'total_amount = ?');
      updateParams.push(subtotal.toFixed(2), taxAmount.toFixed(2), totalAmount.toFixed(2));
      newLineItems = processedLineItems;
    }

    updateFields.push('updated_by = ?', 'updated_date = NOW()');
    updateParams.push(req.user?.id || 1);

    await withTransaction(async (tq) => {
      if (updateFields.length > 0) {
        await tq(`UPDATE invoices SET ${updateFields.join(', ')} WHERE id = ?`, [...updateParams, id]);
      }
      if (newLineItems) {
        await tq('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
        for (const li of newLineItems) {
          await tq(
            `INSERT INTO invoice_items
               (invoice_id, item_id, item_name, description, quantity, unit, rate, discount_percent, tax_rate, amount)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, li.item_id, li.item_name, li.description, li.quantity, li.unit, li.rate, li.discount_percent, li.tax_rate, li.amount]
          );
        }
      }
    });

    logger.info('Invoice updated', { invoiceId: id, userId: req.user?.id });

    const updatedResult = await query('SELECT * FROM invoices WHERE id = ?', [id]);

    await AuditService.logAction(
      req.user?.id ? String(req.user.id) : undefined,
      'invoices', id, 'UPDATE', existingInvoice, updatedResult.rows[0],
      req.ip, req.get('User-Agent')
    );

    res.json({
      success: true,
      data: { invoice: updatedResult.rows[0] },
    });
  });

  static deleteInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Get existing invoice with agency filter
    let whereClause = 'WHERE id = ? AND is_deleted = 0';
    let params: any[] = [id];
    const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);

    const existingResult = await query(`SELECT * FROM invoices ${filtered.whereClause}`, filtered.params);
    if (existingResult.rows.length === 0) {
      throw createError('Invoice not found', 404);
    }

    const existingInvoice = existingResult.rows[0];

    // Don't allow deletion of paid invoices
    if (existingInvoice.status === 'paid') {
      throw createError('Cannot delete a paid invoice', 400);
    }

    await withTransaction(async (tq) => {
      await tq('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
      await tq(
        'UPDATE invoices SET is_deleted = 1, updated_by = ?, updated_date = NOW() WHERE id = ?',
        [req.user?.id || 1, id]
      );
    });

    await AuditService.logAction(
      req.user?.id ? String(req.user.id) : undefined,
      'invoices', id, 'DELETE', existingInvoice, null,
      req.ip, req.get('User-Agent')
    );

    logger.info('Invoice deleted', { invoiceId: id, userId: req.user?.id });

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  });

  // Email invoice with PDF
  static emailInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { to, cc, bcc, subject, message } = req.body;

    if (!to || to.length === 0) {
      throw createError('Recipient email is required', 400);
    }

    // Get invoice with agency filter
    let whereClause = 'WHERE i.id = ? AND i.is_deleted = 0';
    let params: any[] = [id];
    const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null, 'i');

    const invoiceResult = await query(
      `SELECT i.*, CONCAT(c.fname, ' ', c.lname) as customer_name, c.customer_email
       FROM invoices i JOIN customers c ON i.customer_id = c.id ${filtered.whereClause}`,
      filtered.params
    );

    if (invoiceResult.rows.length === 0) {
      throw createError('Invoice not found', 404);
    }

    const invoice = invoiceResult.rows[0];

    logger.info('ðŸ“§ Generating PDF and sending invoice email...', {
      invoiceId: id,
      invoiceNumber: invoice.invoice_number,
      to,
    });

    const { PDFService } = await import('../services/pdfService');
    const { emailService } = await import('../services/emailService');

    logger.info('ðŸ“„ Generating PDF for invoice...', { invoiceId: id });
    const pdfBuffer = await PDFService.generateInvoicePDF(Number(id));
    logger.info('âœ… PDF generated successfully', { size: pdfBuffer.length });

    try {
      const docType = invoice.type || 'invoice';
      const docTypeLabel = docType.charAt(0).toUpperCase() + docType.slice(1);

      await emailService.sendInvoiceEmailWithPDF({
        to,
        cc,
        bcc,
        subject: subject || `${docTypeLabel} ${invoice.invoice_number}`,
        invoiceNumber: invoice.invoice_number,
        customerName: invoice.customer_name,
        totalAmount: invoice.total_amount,
        pdfBuffer,
        message,
        type: docType,
      });

      logger.info(`âœ… ${docTypeLabel} emailed successfully`, { invoiceId: id, to });

      res.json({
        success: true,
        message: `${docTypeLabel} sent successfully via email`,
      });
    } catch (error: any) {
      logger.error('âŒ Failed to send invoice email', { error: error.message });
      throw createError(error.message || 'Failed to send email. Please check SMTP configuration.', 500);
    }
  });

  // Download invoice PDF
  static downloadInvoicePDF = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Verify invoice exists with agency filter
    let whereClause = 'WHERE id = ? AND is_deleted = 0';
    let params: any[] = [id];
    const filtered = addAgencyFilter(whereClause, params, req.agencyId ?? null);

    const invoiceResult = await query(`SELECT invoice_number FROM invoices ${filtered.whereClause}`, filtered.params);

    if (invoiceResult.rows.length === 0) {
      throw createError('Invoice not found', 404);
    }

    const invoiceNumber = invoiceResult.rows[0].invoice_number;

    logger.info('ðŸ“„ Generating PDF for download...', { invoiceId: id, invoiceNumber });

    const { PDFService } = await import('../services/pdfService');
    const pdfBuffer = await PDFService.generateInvoicePDF(Number(id));

    logger.info('âœ… PDF generated successfully', { size: pdfBuffer.length });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceNumber}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.send(pdfBuffer);
  });
}


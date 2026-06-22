import { Router, Request, Response } from 'express';
import { emailService, buildInvoiceEmailHtml } from '../services/emailService';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { agencyService } from '../services/agencyService';
import { logger } from '../config/logger';

const router = Router();

// Preview email HTML (no PDF, just the rendered template)
router.get('/preview', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type = 'invoice', invoiceNumber = 'INV-001', customerName = 'Customer', amount = '0.00' } = req.query;

  const agencyId = req.user?.agencyId;
  const settings = agencyId ? await agencyService.getAgencySettings(agencyId) : {};
  const themeColor = (settings as any)?.email_theme_color || '#667eea';
  const companyName = process.env.COMPANY_NAME || 'ERP System';

  const typeStr = String(type);
  const html = buildInvoiceEmailHtml({
    typeLabel: typeStr.charAt(0).toUpperCase() + typeStr.slice(1),
    customerName: String(customerName),
    invoiceNumber: String(invoiceNumber),
    totalAmount: String(amount),
    companyName,
    themeColor,
  });

  res.json({ success: true, data: { html } });
}));

// Test email configuration
router.get('/test', authenticate, async (req: Request, res: Response) => {
  try {
    const isConnected = await emailService.testConnection();
    
    res.json({
      success: isConnected,
      message: isConnected 
        ? 'Email service is configured and working' 
        : 'Email service is not configured or connection failed',
    });
  } catch (error) {
    logger.error('Email test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test email service',
    });
  }
});

// Send invoice email
router.post('/send-invoice', authenticate, async (req: Request, res: Response) => {
  try {
    const { recipientEmail, recipientName, invoiceNumber, invoiceAmount } = req.body;

    if (!recipientEmail || !recipientName || !invoiceNumber || !invoiceAmount) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
      return;
    }

    const sent = await emailService.sendInvoiceEmail(
      recipientEmail,
      recipientName,
      invoiceNumber,
      invoiceAmount
    );

    if (sent) {
      res.json({
        success: true,
        message: 'Invoice email sent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send invoice email. Email service may not be configured.',
      });
    }
  } catch (error) {
    logger.error('Send invoice email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invoice email',
    });
  }
});

// Send purchase order email
router.post('/send-purchase-order', authenticate, async (req: Request, res: Response) => {
  try {
    const { recipientEmail, recipientName, poNumber, poAmount } = req.body;

    if (!recipientEmail || !recipientName || !poNumber || !poAmount) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
      return;
    }

    const sent = await emailService.sendPurchaseOrderEmail(
      recipientEmail,
      recipientName,
      poNumber,
      poAmount
    );

    if (sent) {
      res.json({
        success: true,
        message: 'Purchase order email sent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send purchase order email. Email service may not be configured.',
      });
    }
  } catch (error) {
    logger.error('Send purchase order email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send purchase order email',
    });
  }
});

// Send payment receipt email
router.post('/send-payment-receipt', authenticate, async (req: Request, res: Response) => {
  try {
    const { recipientEmail, recipientName, receiptNumber, paymentAmount, paymentDate } = req.body;

    if (!recipientEmail || !recipientName || !receiptNumber || !paymentAmount || !paymentDate) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
      return;
    }

    const sent = await emailService.sendPaymentReceiptEmail(
      recipientEmail,
      recipientName,
      receiptNumber,
      paymentAmount,
      paymentDate
    );

    if (sent) {
      res.json({
        success: true,
        message: 'Payment receipt email sent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send payment receipt email. Email service may not be configured.',
      });
    }
  } catch (error) {
    logger.error('Send payment receipt email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send payment receipt email',
    });
  }
});

export default router;

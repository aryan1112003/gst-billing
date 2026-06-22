import nodemailer from 'nodemailer';
import { logger } from '../config/logger';

export interface InvoiceEmailHtmlOptions {
  typeLabel: string;
  customerName: string;
  invoiceNumber: string;
  totalAmount: string;
  message?: string;
  companyName: string;
  themeColor?: string; // default '#667eea'
}

export function buildInvoiceEmailHtml(options: InvoiceEmailHtmlOptions): string {
  const {
    typeLabel,
    customerName,
    invoiceNumber,
    totalAmount,
    message,
    companyName,
    themeColor = '#667eea',
  } = options;

  const type = typeLabel.toLowerCase();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header {
          background: linear-gradient(135deg, ${themeColor} 0%, ${themeColor} 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .header h1 { margin: 0; font-size: 28px; }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .invoice-details {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .invoice-details p { margin: 10px 0; }
        .amount {
          font-size: 32px;
          font-weight: bold;
          color: ${themeColor};
          margin: 15px 0;
        }
        .message-box {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📄 ${typeLabel}</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${customerName}</strong>,</p>
          <p>Thank you for your business. Please find attached your ${type}.</p>

          <div class="invoice-details">
            <p><strong>${typeLabel} Number:</strong> ${invoiceNumber}</p>
            <p><strong>Total Amount:</strong></p>
            <div class="amount">₹${totalAmount}</div>
          </div>

          ${message ? `<div class="message-box"><strong>Note:</strong> ${message}</div>` : ''}

          <p>The ${type} PDF is attached to this email. If you have any questions, please don't hesitate to contact us.</p>

          <p style="margin-top: 30px;">Best regards,<br><strong>${companyName}</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer;
    path?: string;
  }>;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      // Check if email configuration exists
      const emailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      };

      // Only create transporter if credentials are provided
      if (emailConfig.auth.user && emailConfig.auth.pass) {
        this.transporter = nodemailer.createTransport(emailConfig);
        logger.info('✅ Email service initialized successfully');
        logger.info(`📧 SMTP configured: ${emailConfig.host}:${emailConfig.port}`);
      } else {
        logger.warn('⚠️ Email service not configured - SMTP credentials missing');
        logger.warn('Please set SMTP_USER and SMTP_PASS in .env file');
      }
    } catch (error) {
      logger.error('❌ Failed to initialize email service:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      const errorMsg = 'Email service not configured. Please set SMTP credentials in .env file';
      logger.warn(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const mailOptions = {
        from: `${process.env.SMTP_FROM_NAME || 'ERP System'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      };

      logger.info(`📧 Sending email to ${options.to}...`);
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`✅ Email sent successfully to ${options.to}`, { messageId: info.messageId });
      return true;
    } catch (error: any) {
      logger.error('❌ Failed to send email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendInvoiceEmail(
    recipientEmail: string,
    recipientName: string,
    invoiceNumber: string,
    invoiceAmount: number,
    pdfBuffer?: Buffer,
    themeColor?: string
  ): Promise<boolean> {
    const html = buildInvoiceEmailHtml({
      typeLabel: 'Invoice',
      customerName: recipientName,
      invoiceNumber,
      totalAmount: invoiceAmount.toFixed(2),
      companyName: process.env.COMPANY_NAME || 'ERP Business Management',
      themeColor,
    });

    const attachments = pdfBuffer
      ? [
        {
          filename: `Invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ]
      : undefined;

    return this.sendEmail({
      to: recipientEmail,
      subject: `Invoice ${invoiceNumber}`,
      html,
      attachments,
    });
  }

  async sendPurchaseOrderEmail(
    recipientEmail: string,
    recipientName: string,
    poNumber: string,
    poAmount: number,
    pdfBuffer?: Buffer,
    themeColor?: string
  ): Promise<boolean> {
    const html = buildInvoiceEmailHtml({
      typeLabel: 'Purchase Order',
      customerName: recipientName,
      invoiceNumber: poNumber,
      totalAmount: poAmount.toFixed(2),
      companyName: process.env.COMPANY_NAME || 'ERP Business Management',
      themeColor,
    });

    const attachments = pdfBuffer
      ? [
        {
          filename: `PurchaseOrder-${poNumber}.pdf`,
          content: pdfBuffer,
        },
      ]
      : undefined;

    return this.sendEmail({
      to: recipientEmail,
      subject: `Purchase Order ${poNumber}`,
      html,
      attachments,
    });
  }

  async sendPaymentReceiptEmail(
    recipientEmail: string,
    recipientName: string,
    receiptNumber: string,
    paymentAmount: number,
    paymentDate: string,
    pdfBuffer?: Buffer
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .receipt-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #10b981; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Received</h1>
          </div>
          <div class="content">
            <p>Dear ${recipientName},</p>
            <p>Thank you for your payment. It was a pleasure doing business with you. We look forward to work together again!</p>
            
            <div class="receipt-details">
              <p><strong>Receipt Number:</strong> ${receiptNumber}</p>
              <p><strong>Payment Date:</strong> ${paymentDate}</p>
              <p><strong>Amount Received:</strong> <span class="amount">₹${paymentAmount.toFixed(2)}</span></p>
            </div>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Regards,<br>${process.env.COMPANY_NAME || 'ERP Business Management'}</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const attachments = pdfBuffer
      ? [
        {
          filename: `PaymentReceipt-${receiptNumber}.pdf`,
          content: pdfBuffer,
        },
      ]
      : undefined;

    return this.sendEmail({
      to: recipientEmail,
      subject: `Payment Receipt ${receiptNumber}`,
      html,
      attachments,
    });
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      logger.warn('Email service not configured');
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error);
      return false;
    }
  }

  async sendInvoiceEmailWithPDF(options: {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    invoiceNumber: string;
    customerName: string;
    totalAmount: string;
    pdfBuffer: Buffer;
    message?: string;
    type?: string;
    themeColor?: string;
  }): Promise<boolean> {
    const { to, cc, bcc, subject, invoiceNumber, customerName, totalAmount, pdfBuffer, message, type = 'invoice', themeColor } = options;
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

    const html = buildInvoiceEmailHtml({
      typeLabel,
      customerName,
      invoiceNumber,
      totalAmount,
      message,
      companyName: process.env.COMPANY_NAME || 'ERP Business Management',
      themeColor,
    });

    const toEmails = Array.isArray(to) ? to.join(', ') : to;
    const ccEmails = cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined;
    const bccEmails = bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined;

    if (!this.transporter) {
      const errorMsg = 'Email service not configured. Please set SMTP credentials in .env file';
      logger.warn(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const mailOptions = {
        from: `${process.env.SMTP_FROM_NAME || 'ERP System'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: toEmails,
        cc: ccEmails,
        bcc: bccEmails,
        subject,
        html,
        attachments: [
          {
            filename: `${type}-${invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      logger.info(`📧 Sending ${type} email to ${toEmails}...`);
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`✅ ${typeLabel} email sent successfully to ${toEmails}`, { messageId: info.messageId });
      return true;
    } catch (error: any) {
      logger.error(`❌ Failed to send ${type} email:`, error);
      throw new Error(`Failed to send ${type} email: ${error.message}`);
    }
  }

  async sendPurchaseEmail(options: {
    to: string[];
    cc?: string[];
    subject: string;
    message: string;
    purchaseNumber: string;
    vendorName: string;
    totalAmount: number;
    pdfBuffer: Buffer;
    themeColor?: string;
  }): Promise<void> {
    try {
      const { to, cc, subject, message, purchaseNumber, vendorName, totalAmount, pdfBuffer, themeColor } = options;

      const htmlContent = buildInvoiceEmailHtml({
        typeLabel: 'Purchase Order',
        customerName: vendorName,
        invoiceNumber: purchaseNumber,
        totalAmount: totalAmount.toLocaleString(),
        message,
        companyName: process.env.COMPANY_NAME || 'ERP Business Management',
        themeColor,
      });

      const mailOptions = {
        from: `${process.env.SMTP_FROM_NAME || 'Your Company'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: to.join(', '),
        cc: cc ? cc.join(', ') : undefined,
        subject,
        html: htmlContent,
        attachments: [
          {
            filename: `purchase-order-${purchaseNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      };

      if (this.transporter) {
        await this.transporter.sendMail(mailOptions);
        logger.info('Purchase order email sent successfully', { purchaseNumber, to });
      } else {
        throw new Error('Email transporter not initialized');
      }
    } catch (error) {
      logger.error('Error sending purchase order email:', error);
      throw new Error('Failed to send purchase order email');
    }
  }
  async sendVerificationEmail(to: string, token: string): Promise<boolean> {
    const backendUrl = process.env.API_BASE_URL || `http://${process.env.DB_HOST === 'localhost' ? '192.168.1.11' : 'localhost'}:${process.env.PORT || 8001}`;
    const verificationUrl = `${backendUrl}/api/v1/auth/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
            <h2 style="color: #667eea; text-align: center;">Verify Your Email</h2>
            <p>Welcome to ${process.env.COMPANY_NAME || 'ERP Business Management'}!</p>
            <p>Please click the button below to verify your email address and activate your account.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background-color: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
            </div>
            <p style="font-size: 12px; color: #666;">Or paste this link in your browser: <br>${verificationUrl}</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to, subject: 'Verify your Account', html });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
            <h2 style="color: #e53e3e; text-align: center;">Reset Password</h2>
            <p>You requested a password reset. Use the code below in the app to reset your password.</p>
            <div style="text-align: center; margin: 30px 0;">
                <h1 style="background-color: #fff; border: 2px dashed #e53e3e; color: #e53e3e; padding: 15px; display: inline-block; letter-spacing: 5px;">${token}</h1>
            </div>
            <p>This code will expire in 1 hour.</p>
            <p style="font-size: 12px; color: #666;">If you did not request this, please ignore this email.</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to, subject: 'Password Reset Request', html });
  }
  async sendOtpEmail(to: string, otp: string, purpose: string = 'Security Verification'): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
            <h2 style="color: #667eea; text-align: center;">${purpose}</h2>
            <p>Please use the following One Time Password (OTP) to complete your request.</p>
            <div style="text-align: center; margin: 30px 0;">
                <h1 style="background-color: #fff; border: 2px dashed #667eea; color: #667eea; padding: 15px; display: inline-block; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p>This code will expire in 15 minutes.</p>
            <p style="font-size: 12px; color: #666;">If you did not request this code, please ignore this email.</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to, subject: `${purpose} Code`, html });
  }
}

export const emailService = new EmailService();

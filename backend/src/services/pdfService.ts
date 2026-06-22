import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { query } from '../config/database';
import { logger } from '../config/logger';

/**
 * Download an image from a URL (Cloudinary or any http/https URL) into a Buffer.
 * Falls back to reading a local file path if the URL starts with '/'.
 */
function fetchImageBuffer(logoUrl: string): Promise<Buffer | null> {
    return new Promise((resolve) => {
        try {
            if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
                // Remote URL (Cloudinary)
                const lib = logoUrl.startsWith('https://') ? https : http;
                lib.get(logoUrl, (res) => {
                    const chunks: Buffer[] = [];
                    res.on('data', (chunk) => chunks.push(chunk));
                    res.on('end', () => resolve(Buffer.concat(chunks)));
                    res.on('error', () => resolve(null));
                }).on('error', () => resolve(null));
            } else {
                // Legacy local path  e.g. "/uploads/logos/agency-1.jpg"
                const localPath = path.join(process.cwd(), logoUrl.replace(/^\//, ''));
                if (fs.existsSync(localPath)) {
                    resolve(fs.readFileSync(localPath));
                } else {
                    resolve(null);
                }
            }
        } catch {
            resolve(null);
        }
    });
}

interface InvoiceData {
    id: number;
    invoice_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    customer_address?: string;
    customer_city?: string;
    customer_state?: string;
    customer_pincode?: string;
    invoice_date: string;
    due_date: string;
    subtotal: number;
    total_amount: number;
    adjustment_amount?: number;
    status: number;
    items: any[];
    type: string;
}

export class PDFService {
    static async generateInvoicePDF(invoiceId: number): Promise<Buffer> {
        try {
            logger.info('📄 Fetching invoice data...', { invoiceId });

            // Fetch invoice data — all columns match mawebtec_lms schema
            const invoiceResult = await query(
                `SELECT i.*,
                        CONCAT(c.fname, ' ', c.lname) AS customer_name,
                        c.customer_email,
                        COALESCE(c.cwork_phone, c.cmobile_phone) AS customer_phone,
                        c.company_name AS customer_address
                 FROM invoices i
                 JOIN customers c ON i.customer_id = c.id
                 WHERE i.id = ? AND i.is_deleted = 0`,
                [invoiceId]
            );

            if (!invoiceResult.rows || invoiceResult.rows.length === 0) {
                throw new Error('Invoice not found');
            }

            const invoice = invoiceResult.rows[0];
            logger.info('✅ Invoice data fetched', { invoiceNumber: invoice.invoice_number, type: invoice.type });

            // Parse line items from items_details JSON
            // Schema stores items as: {"items":[{item_id,descrip,qty,hsn_sac_code,rate,discount,tax,amount},...]}
            let items: any[] = [];
            try {
                const details = typeof invoice.items_details === 'string'
                    ? JSON.parse(invoice.items_details)
                    : (invoice.items_details || {});
                const rawItems = details.items || [];
                items = rawItems.map((item: any) => ({
                    descrip:      item.descrip || item.description || item.item_name || '',
                    hsn_sac_code: item.hsn_sac_code || item.hsn_sac || '',
                    qty:          parseFloat(item.qty ?? item.quantity ?? 1),
                    rate:         parseFloat(item.rate ?? item.unit_price ?? 0),
                    discount:     parseFloat(item.discount ?? 0),
                    tax:          parseFloat(item.tax ?? item.tax_rate ?? 0),
                    amount:       parseFloat(item.amount ?? 0),
                }));
            } catch (parseErr) {
                logger.warn('⚠️ Could not parse items_details JSON', { invoiceId, error: parseErr });
            }
            logger.info(`📦 Parsed ${items.length} line items from items_details`);

            // Fetch agency details — use agency_id from invoice if present, else fall back to agency 1
            const agencyData = await this.getAgencyData(invoice.agency_id ?? null);

            // Pre-fetch logo buffer (supports Cloudinary URLs and legacy local paths)
            const logoBuffer = agencyData?.logo_url
                ? await fetchImageBuffer(agencyData.logo_url)
                : null;
            if (logoBuffer) {
                logger.info('🖼️ Logo fetched for PDF', { url: agencyData.logo_url });
            }

            // Generate PDF
            logger.info('🎨 Creating PDF document...');
            return this.createPDF({
                id:               invoice.id,
                invoice_number:   invoice.invoice_number,
                customer_name:    invoice.customer_name,
                customer_email:   invoice.customer_email,
                customer_phone:   invoice.customer_phone,
                customer_address: invoice.customer_address,
                customer_city:    '',
                customer_state:   '',
                customer_pincode: '',
                invoice_date:     invoice.invoice_date,
                due_date:         invoice.due_date,
                subtotal:         parseFloat(invoice.sub_total   ?? 0),
                total_amount:     parseFloat(invoice.total_amount ?? 0),
                adjustment_amount: parseFloat(invoice.adjustment_amount ?? 0),
                status:           invoice.status,
                items:            items,
                type:             invoice.type || 'invoice',
            }, agencyData, logoBuffer);
        } catch (error: any) {
            logger.error('❌ Error generating invoice PDF', { error: error.message, invoiceId });
            throw new Error(`Failed to generate PDF: ${error.message}`);
        }
    }

    private static createPDF(invoice: InvoiceData, agencyData: any = null, logoBuffer: Buffer | null = null): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    margin: 50,
                    size: 'A4',
                    bufferPages: true
                });
                const chunks: Buffer[] = [];

                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    logger.info('✅ PDF created successfully', { size: buffer.length });
                    resolve(buffer);
                });
                doc.on('error', (err) => {
                    logger.error('❌ PDF creation error', { error: err });
                    reject(err);
                });

                // Colors
                const primaryColor = '#667eea';
                const textColor = '#333333';
                const lightGray = '#f5f5f5';

                this.drawHeader(doc, agencyData, (invoice.type || 'invoice').toUpperCase(), primaryColor, logoBuffer);

                // Reset position — start below header band (130px)
                doc.fillColor(textColor);
                let yPos = 148;

                // Document details box (right side)
                doc.fontSize(10)
                    .fillColor(textColor)
                    .text(`${invoice.type === 'quotation' ? 'Quotation' : 'Invoice'} #: ${invoice.invoice_number}`, 350, yPos, { align: 'right' })
                    .text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}`, 350, yPos + 15, { align: 'right' })
                    .text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-IN')}`, 350, yPos + 30, { align: 'right' });

                // Customer details
                yPos = 148;
                doc.fontSize(12)
                    .fillColor(primaryColor)
                    .text('BILL TO:', 50, yPos);

                yPos += 20;
                doc.fontSize(11)
                    .fillColor(textColor)
                    .font('Helvetica-Bold')
                    .text(invoice.customer_name, 50, yPos);

                yPos += 15;
                doc.font('Helvetica').fontSize(10);

                if (invoice.customer_email) {
                    doc.text(invoice.customer_email, 50, yPos);
                    yPos += 15;
                }
                if (invoice.customer_phone) {
                    doc.text(`Phone: ${invoice.customer_phone}`, 50, yPos);
                    yPos += 15;
                }
                if (invoice.customer_address) {
                    doc.text(invoice.customer_address, 50, yPos, { width: 250 });
                    yPos += 15;
                }

                // Add city, state, pincode if available
                const locationParts = [];
                if (invoice.customer_city) locationParts.push(invoice.customer_city);
                if (invoice.customer_state) locationParts.push(invoice.customer_state);
                if (invoice.customer_pincode) locationParts.push(invoice.customer_pincode);

                if (locationParts.length > 0) {
                    doc.text(locationParts.join(', '), 50, yPos, { width: 250 });
                    yPos += 15;
                }

                // Items table
                yPos = Math.max(yPos, 240) + 20;

                // Table header
                doc.rect(50, yPos, 512, 25).fill(lightGray);
                doc.fillColor(textColor)
                    .fontSize(10)
                    .font('Helvetica-Bold')
                    .text('Description', 60, yPos + 8, { width: 220 })
                    .text('Qty', 280, yPos + 8, { width: 50, align: 'center' })
                    .text('Rate', 330, yPos + 8, { width: 80, align: 'right' })
                    .text('Tax', 410, yPos + 8, { width: 60, align: 'right' })
                    .text('Amount', 470, yPos + 8, { width: 82, align: 'right' });

                yPos += 25;
                doc.font('Helvetica');

                // Items
                invoice.items.forEach((item: any, index: number) => {
                    // Alternate row colors
                    if (index % 2 === 0) {
                        doc.rect(50, yPos, 512, 25).fill('#fafafa');
                    }

                    doc.fillColor(textColor)
                        .fontSize(9)
                        .text(item.descrip || 'Item', 60, yPos + 8, { width: 220 })
                        .text(item.qty || '0', 280, yPos + 8, { width: 50, align: 'center' })
                        .text(`Rs.${parseFloat(item.rate || 0).toFixed(2)}`, 330, yPos + 8, { width: 80, align: 'right' })
                        .text(`${item.tax || 0}%`, 410, yPos + 8, { width: 60, align: 'right' })
                        .text(`Rs.${parseFloat(item.amount || 0).toFixed(2)}`, 470, yPos + 8, { width: 82, align: 'right' });

                    yPos += 25;
                });

                // Totals section
                yPos += 10;
                doc.moveTo(50, yPos).lineTo(562, yPos).stroke('#cccccc');
                yPos += 15;

                // Two-column totals layout: label (width 90) | amount (width 110, right-aligned)
                const labelX  = 352;
                const labelW  = 90;
                const amtX    = 450;
                const amtW    = 110;   // enough for "Rs.999999.00"

                doc.font('Helvetica').fontSize(10).fillColor(textColor);
                doc.text('Subtotal:', labelX, yPos, { width: labelW, align: 'right' });
                doc.text(`Rs.${invoice.subtotal.toFixed(2)}`, amtX, yPos, { width: amtW, align: 'right' });
                yPos += 20;

                if (invoice.adjustment_amount && invoice.adjustment_amount > 0) {
                    doc.text('Discount:', labelX, yPos, { width: labelW, align: 'right' });
                    doc.text(`-Rs.${invoice.adjustment_amount.toFixed(2)}`, amtX, yPos, { width: amtW, align: 'right' });
                    yPos += 20;
                }

                // Tax summary (if any items have tax)
                const totalTax = invoice.items.reduce((sum: number, it: any) => {
                    const taxable = parseFloat(it.rate || 0) * parseFloat(it.qty || 0);
                    return sum + taxable * (parseFloat(it.tax || 0) / 100);
                }, 0);
                if (totalTax > 0) {
                    doc.text('Tax:', labelX, yPos, { width: labelW, align: 'right' });
                    doc.text(`Rs.${totalTax.toFixed(2)}`, amtX, yPos, { width: amtW, align: 'right' });
                    yPos += 20;
                }

                // Separator line
                doc.moveTo(labelX, yPos).lineTo(562, yPos).stroke('#cccccc');
                yPos += 8;

                // Total row with colored background
                const boxStartX = labelX - 8;
                const boxWidth  = 562 - boxStartX;
                doc.rect(boxStartX, yPos - 4, boxWidth, 32).fill(primaryColor);

                doc.font('Helvetica-Bold').fontSize(12).fillColor('#FFFFFF');
                doc.text('TOTAL:', labelX, yPos + 6, { width: labelW, align: 'right' });
                doc.text(`Rs.${invoice.total_amount.toFixed(2)}`, amtX, yPos + 6, { width: amtW, align: 'right' });

                // Footer
                doc.fontSize(8)
                    .fillColor('#666666')
                    .font('Helvetica')
                    .text('Thank you for your business!', 50, 750, { align: 'center', width: 512 })
                    .text(`Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, 50, 765, { align: 'center', width: 512 });

                doc.end();
            } catch (error) {
                logger.error('❌ Error in PDF creation', { error });
                reject(error);
            }
        });
    }

    private static async getAgencyData(agencyId: number | null): Promise<any> {
        try {
            // Try specific agency
            if (agencyId) {
                const result = await query(
                    `SELECT company_name, phone, address, logo_url, gst_number FROM agencies WHERE id = ?`,
                    [agencyId]
                );
                if (result.rows?.[0]?.logo_url) {
                    return result.rows[0];
                }

                // If it exists but has no logo, keep it as a partial fallback but we might prefer Agency 1's logo
                if (result.rows?.[0]) {
                    const specificAgency = result.rows[0];
                    // Try to get Agency 1's logo if this one doesn't have it
                    const mainAgency = await query(`SELECT logo_url FROM agencies WHERE id = 1`);
                    if (mainAgency.rows?.[0]?.logo_url) {
                        specificAgency.logo_url = mainAgency.rows[0].logo_url;
                    }
                    return specificAgency;
                }
            }

            // Fallback to Agency 1
            const mainResult = await query(
                `SELECT company_name, phone, address, logo_url, gst_number FROM agencies WHERE id = 1`
            );
            return mainResult.rows?.[0] || null;
        } catch (error) {
            logger.warn('⚠️ Error fetching agency data, using env fallback', { error });
            return null;
        }
    }

    /**
     * Draw the header band onto the PDF doc.
     * logoBuffer is pre-fetched (Cloudinary or local) before entering the sync PDFKit flow.
     */
    private static drawHeader(
        doc: any,
        agencyData: any,
        title: string,
        color: string = '#667eea',
        logoBuffer: Buffer | null = null
    ) {
        const HEADER_HEIGHT = 130;

        // Header background band
        doc.rect(0, 0, 612, HEADER_HEIGHT).fill(color);

        // Logo — use pre-fetched buffer
        let hasLogo = false;
        if (logoBuffer) {
            try {
                doc.image(logoBuffer, 50, 25, { width: 60, height: 60, fit: [60, 60] });
                hasLogo = true;
            } catch (e) {
                logger.warn('⚠️ Could not embed logo in PDF', { error: (e as Error).message });
            }
        }

        // Company name — reduce font so long names don't wrap
        const companyNameX = hasLogo ? 122 : 50;
        const companyName = agencyData?.company_name || process.env.COMPANY_NAME || 'Ma Web Technologies';

        doc.fontSize(18)
            .fillColor('#FFFFFF')
            .font('Helvetica-Bold')
            .text(companyName, companyNameX, 28, { width: 210, lineBreak: false });

        // GST number immediately below — use doc.y so it never overlaps
        const gstY = doc.y + 4;
        if (agencyData?.gst_number) {
            doc.fontSize(9)
                .fillColor('rgba(255,255,255,0.85)')
                .font('Helvetica')
                .text(`GSTIN: ${agencyData.gst_number}`, companyNameX, gstY);
        }

        // Phone / address line below GSTIN
        if (agencyData?.phone) {
            doc.fontSize(9)
                .fillColor('rgba(255,255,255,0.75)')
                .font('Helvetica')
                .text(`Ph: ${agencyData.phone}`, companyNameX, doc.y + 3);
        }

        // Document type title (right side) — vertically centered in header band
        doc.fontSize(20)
            .fillColor('#FFFFFF')
            .font('Helvetica-Bold')
            .text(title.toUpperCase(), 340, 45, { align: 'right', width: 220 });
    }

    /** Replace ₹ with Rs. — Helvetica doesn't include the rupee glyph */
    private static rs(amount: number | string): string {
        return `Rs.${parseFloat(String(amount)).toFixed(2)}`;
    }

    static async generatePurchasePDF(purchaseData: any): Promise<Buffer> {
        // Pre-fetch agency data and logo BEFORE entering the sync PDFKit Promise
        const agencyData = await this.getAgencyData(purchaseData.agency_id || null);
        const logoBuffer = agencyData?.logo_url ? await fetchImageBuffer(agencyData.logo_url) : null;

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const chunks: Buffer[] = [];

                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                (() => {
                        this.drawHeader(doc, agencyData, 'PURCHASE ORDER', '#667eea', logoBuffer);

                        let yPos = 148;

                        // PO Number and Date (right side)
                        doc.fillColor('#333333').fontSize(10)
                            .text(`PO Number: ${purchaseData.purchaseNumber}`, 350, yPos, { align: 'right' })
                            .text(`Date: ${new Date(purchaseData.purchaseDate).toLocaleDateString()}`, 350, yPos + 15, { align: 'right' });

                        // Company details (Fallback if needed)
                        yPos = 140;
                        doc.fontSize(12).fillColor('#667eea').text('FROM:', 50, yPos);
                        yPos += 20;
                        doc.fontSize(10).fillColor('#333333')
                            .text(agencyData?.company_name || process.env.COMPANY_NAME || 'Your Company', 50, yPos);
                        yPos += 15;
                        if (agencyData?.address) {
                            doc.text(agencyData.address, 50, yPos, { width: 250 });
                            yPos += 15;
                        }
                        if (agencyData?.phone) {
                            doc.text(`Phone: ${agencyData.phone}`, 50, yPos);
                        }

                        // Vendor Info
                        doc.fontSize(10).text('To:', { continued: false });
                        doc.fontSize(12).font('Helvetica-Bold').text(purchaseData.vendor.name);
                        if (purchaseData.vendor.address) {
                            doc.fontSize(10).text(purchaseData.vendor.address);
                        }
                        if (purchaseData.vendor.phone) {
                            doc.text(`Phone: ${purchaseData.vendor.phone}`);
                        }
                        if (purchaseData.vendor.email) {
                            doc.text(`Email: ${purchaseData.vendor.email}`);
                        }
                        doc.moveDown(2);

                        // Items Table
                        const tableTop = doc.y;
                        const itemCodeX = 50;
                        const descriptionX = 120;
                        const quantityX = 280;
                        const rateX = 340;
                        const taxX = 400;
                        const amountX = 460;

                        // Table Header
                        doc.fontSize(10).font('Helvetica-Bold');
                        doc.text('Item', itemCodeX, tableTop);
                        doc.text('Description', descriptionX, tableTop);
                        doc.text('Qty', quantityX, tableTop);
                        doc.text('Rate', rateX, tableTop);
                        doc.text('Tax', taxX, tableTop);
                        doc.text('Amount', amountX, tableTop);

                        // Line under header
                        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

                        // Table Rows
                        doc.font('Helvetica');
                        let yPosition = tableTop + 25;

                        purchaseData.lineItems.forEach((item: any, index: number) => {
                            if (yPosition > 700) {
                                doc.addPage();
                                yPosition = 50;
                            }

                            doc.fontSize(9).font('Helvetica');
                            doc.text((index + 1).toString(), itemCodeX, yPosition);
                            doc.text(item.description || '-', descriptionX, yPosition, { width: 150 });
                            doc.text(item.quantity.toString(), quantityX, yPosition);
                            doc.text(`Rs.${item.unitPrice.toFixed(2)}`, rateX, yPosition);
                            doc.text(`${item.taxRate}%`, taxX, yPosition);
                            doc.text(`Rs.${item.total.toFixed(2)}`, amountX, yPosition);

                            yPosition += 25;
                        });

                        // Line before totals
                        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
                        yPosition += 10;

                        // Totals
                        doc.fontSize(10).font('Helvetica-Bold');
                        doc.text('Subtotal:', 400, yPosition);
                        doc.text(`Rs.${purchaseData.subtotal.toFixed(2)}`, amountX, yPosition);
                        yPosition += 20;

                        doc.text('Tax:', 400, yPosition);
                        doc.text(`Rs.${purchaseData.taxAmount.toFixed(2)}`, amountX, yPosition);
                        yPosition += 20;

                        doc.fontSize(12);
                        doc.text('Total:', 400, yPosition);
                        doc.text(`Rs.${purchaseData.totalAmount.toFixed(2)}`, amountX, yPosition);
                        yPosition += 30;

                        // Notes
                        if (purchaseData.notes) {
                            doc.fontSize(10).font('Helvetica');
                            doc.text('Notes:', 50, yPosition);
                            yPosition += 15;
                            doc.fontSize(9).text(purchaseData.notes, 50, yPosition, { width: 500 });
                        }

                        // Footer
                        doc.fontSize(8).text(
                            'Thank you for your business!',
                            50,
                            750,
                            { align: 'center' }
                        );

                        doc.end();
                    })();
            } catch (error) {
                logger.error('Error generating purchase PDF:', error);
                reject(error);
            }
        });
    }

    static async generatePaymentReceiptPDF(paymentData: any): Promise<Buffer> {
        // Pre-fetch agency data and logo BEFORE entering the sync PDFKit Promise
        const agencyData = await this.getAgencyData(paymentData.agency_id || null);
        const logoBuffer = agencyData?.logo_url ? await fetchImageBuffer(agencyData.logo_url) : null;

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const chunks: Buffer[] = [];

                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                (() => {
                        this.drawHeader(doc, agencyData, 'PAYMENT RECEIPT', '#10b981', logoBuffer);

                        let yPos = 140;

                        // Payment Details Box
                        doc.rect(50, 150, 512, 120).stroke('#10b981');

                        yPos = 170;
                        const leftX = 70;
                        const rightX = 300;

                        doc.fontSize(10).font('Helvetica-Bold').text('Receipt Number:', leftX, yPos);
                        doc.font('Helvetica').text(paymentData.referenceNumber || '-', leftX + 100, yPos);

                        doc.font('Helvetica-Bold').text('Date:', rightX, yPos);
                        doc.font('Helvetica').text(new Date(paymentData.paymentDate).toLocaleDateString(), rightX + 50, yPos);

                        yPos += 25;
                        doc.font('Helvetica-Bold').text('Customer:', leftX, yPos);
                        doc.font('Helvetica').text(paymentData.customerName, leftX + 100, yPos);

                        doc.font('Helvetica-Bold').text('Payment Mode:', rightX, yPos);
                        doc.font('Helvetica').text(paymentData.paymentMode, rightX + 100, yPos);

                        yPos += 25;
                        doc.font('Helvetica-Bold').text('Amount Received:', leftX, yPos);
                        doc.fillColor('#10b981').fontSize(14).text(`Rs.${parseFloat(paymentData.amount).toFixed(2)}`, leftX + 120, yPos - 3);

                        // Reset color
                        doc.fillColor('#333333').fontSize(10);

                        // Allocations Table
                        yPos = 300;
                        doc.font('Helvetica-Bold').text('Payment Allocation Details', 50, yPos);
                        yPos += 20;

                        // Table Header
                        doc.rect(50, yPos, 512, 25).fill('#f0fdf4');
                        doc.fillColor('#333333');
                        doc.text('Invoice #', 60, yPos + 8);
                        doc.text('Total Amount', 200, yPos + 8);
                        doc.text('Paid Amount', 400, yPos + 8);

                        yPos += 25;
                        doc.font('Helvetica');

                        if (paymentData.invoiceAllocations && paymentData.invoiceAllocations.length > 0) {
                            paymentData.invoiceAllocations.forEach((alloc: any) => {
                                doc.text(alloc.invoice_number, 60, yPos + 8);
                                doc.text(`Rs.${parseFloat(alloc.invoice_total).toFixed(2)}`, 200, yPos + 8);
                                doc.text(`Rs.${parseFloat(alloc.paid_amount).toFixed(2)}`, 400, yPos + 8);
                                yPos += 25;
                            });
                        } else {
                            doc.text('No specific invoice allocations', 60, yPos + 8);
                        }

                        // Footer
                        doc.fontSize(8).fillColor('#666666')
                            .text('This is a computer generated receipt.', 50, 700, { align: 'center' });

                        doc.end();
                    })();
            } catch (error) {
                logger.error('Error generating payment receipt PDF:', error);
                reject(error);
            }
        });
    }
}

export const pdfService = PDFService;


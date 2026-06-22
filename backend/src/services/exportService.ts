import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Response } from 'express';

export interface ExportData {
  title: string;
  headers: string[];
  rows: any[][];
  filters?: {
    fromDate?: string;
    toDate?: string;
    [key: string]: any;
  };
  summary?: {
    [key: string]: any;
  };
}

export class ExportService {
  /**
   * Export data to PDF format
   */
  static async exportToPDF(data: ExportData, res: Response): Promise<void> {
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${data.title.replace(/\s+/g, '_')}.pdf"`);
    
    // Pipe the PDF to response
    doc.pipe(res);
    
    // Add title
    doc.fontSize(20).font('Helvetica-Bold').text(data.title, { align: 'center' });
    doc.moveDown();
    
    // Add filters if present
    if (data.filters) {
      doc.fontSize(12).font('Helvetica');
      if (data.filters.fromDate && data.filters.toDate) {
        doc.text(`Period: ${data.filters.fromDate} to ${data.filters.toDate}`, { align: 'center' });
      }
      doc.moveDown();
    }
    
    // Add summary if present
    if (data.summary) {
      doc.fontSize(14).font('Helvetica-Bold').text('Summary:', { underline: true });
      doc.fontSize(12).font('Helvetica');
      
      Object.entries(data.summary).forEach(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const formattedValue = typeof value === 'number' ? 
          (key.toLowerCase().includes('amount') || key.toLowerCase().includes('total') ? 
            `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : 
            value.toLocaleString()) : 
          String(value);
        doc.text(`${label}: ${formattedValue}`);
      });
      doc.moveDown();
    }
    
    // Calculate column widths
    const pageWidth = doc.page.width - 100; // Account for margins
    const columnWidth = pageWidth / data.headers.length;
    
    // Add table headers
    doc.fontSize(10).font('Helvetica-Bold');
    let yPosition = doc.y;
    
    data.headers.forEach((header, index) => {
      const xPosition = 50 + (index * columnWidth);
      doc.text(header, xPosition, yPosition, { 
        width: columnWidth - 5, 
        align: 'left',
        ellipsis: true 
      });
    });
    
    // Draw header line
    yPosition += 20;
    doc.moveTo(50, yPosition).lineTo(doc.page.width - 50, yPosition).stroke();
    yPosition += 10;
    
    // Add table rows
    doc.fontSize(9).font('Helvetica');
    
    data.rows.forEach((row) => {
      // Check if we need a new page
      if (yPosition > doc.page.height - 100) {
        doc.addPage();
        yPosition = 50;
        
        // Re-add headers on new page
        doc.fontSize(10).font('Helvetica-Bold');
        data.headers.forEach((header, index) => {
          const xPosition = 50 + (index * columnWidth);
          doc.text(header, xPosition, yPosition, { 
            width: columnWidth - 5, 
            align: 'left',
            ellipsis: true 
          });
        });
        yPosition += 20;
        doc.moveTo(50, yPosition).lineTo(doc.page.width - 50, yPosition).stroke();
        yPosition += 10;
        doc.fontSize(9).font('Helvetica');
      }
      
      row.forEach((cell, index) => {
        const xPosition = 50 + (index * columnWidth);
        let cellValue = String(cell || '');
        
        // Format currency values
        if (typeof cell === 'number' && 
            (data.headers[index].toLowerCase().includes('amount') || 
             data.headers[index].toLowerCase().includes('total') ||
             data.headers[index].toLowerCase().includes('price') ||
             data.headers[index].toLowerCase().includes('balance'))) {
          cellValue = `₹${cell.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
        }
        
        doc.text(cellValue, xPosition, yPosition, { 
          width: columnWidth - 5, 
          align: 'left',
          ellipsis: true 
        });
      });
      yPosition += 15;
    });
    
    // Add footer
    const now = new Date();
    doc.fontSize(8).font('Helvetica')
       .text(`Generated on: ${now.toLocaleString('en-IN')}`, 50, doc.page.height - 50, { align: 'left' })
       .text(`Page ${doc.bufferedPageRange().count}`, doc.page.width - 100, doc.page.height - 50, { align: 'right' });
    
    // Finalize the PDF
    doc.end();
  }
  
  /**
   * Export data to Excel format
   */
  static async exportToExcel(data: ExportData, res: Response): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(data.title);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${data.title.replace(/\s+/g, '_')}.xlsx"`);
    
    let currentRow = 1;
    
    // Add title
    worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(64 + data.headers.length)}${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = data.title;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };
    currentRow += 2;
    
    // Add filters if present
    if (data.filters && data.filters.fromDate && data.filters.toDate) {
      worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(64 + data.headers.length)}${currentRow}`);
      const filterCell = worksheet.getCell(`A${currentRow}`);
      filterCell.value = `Period: ${data.filters.fromDate} to ${data.filters.toDate}`;
      filterCell.alignment = { horizontal: 'center' };
      currentRow += 2;
    }
    
    // Add summary if present
    if (data.summary) {
      const summaryCell = worksheet.getCell(`A${currentRow}`);
      summaryCell.value = 'Summary:';
      summaryCell.font = { bold: true };
      currentRow++;
      
      Object.entries(data.summary).forEach(([key, value]) => {
        const labelCell = worksheet.getCell(`A${currentRow}`);
        const valueCell = worksheet.getCell(`B${currentRow}`);
        
        labelCell.value = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        if (typeof value === 'number' && 
            (key.toLowerCase().includes('amount') || key.toLowerCase().includes('total'))) {
          valueCell.value = value;
          valueCell.numFmt = '₹#,##0.00';
        } else {
          valueCell.value = value;
        }
        
        currentRow++;
      });
      currentRow++;
    }
    
    // Add headers
    data.headers.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    currentRow++;
    
    // Add data rows
    data.rows.forEach((row) => {
      row.forEach((cell, index) => {
        const excelCell = worksheet.getCell(currentRow, index + 1);
        
        if (typeof cell === 'number') {
          excelCell.value = cell;
          // Format currency columns
          if (data.headers[index].toLowerCase().includes('amount') || 
              data.headers[index].toLowerCase().includes('total') ||
              data.headers[index].toLowerCase().includes('price') ||
              data.headers[index].toLowerCase().includes('balance')) {
            excelCell.numFmt = '₹#,##0.00';
          }
        } else if (cell instanceof Date) {
          excelCell.value = cell;
          excelCell.numFmt = 'dd/mm/yyyy';
        } else {
          excelCell.value = cell;
        }
        
        // Add borders
        excelCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      currentRow++;
    });
    
    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      if (column && typeof column.eachCell === 'function') {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? String(cell.value).length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      }
    });
    
    // Add metadata
    workbook.creator = 'ERP System';
    workbook.lastModifiedBy = 'ERP System';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Write to response
    await workbook.xlsx.write(res);
  }
  
  /**
   * Convert report data to export format
   */
  static formatReportData(reportData: any, title: string, filters?: any): ExportData {
    let headers: string[] = [];
    let rows: any[][] = [];
    let summary: any = undefined;
    
    // Handle different report data formats
    if (reportData.rows && Array.isArray(reportData.rows)) {
      // Database query result format
      if (reportData.rows.length > 0) {
        headers = Object.keys(reportData.rows[0]);
        rows = reportData.rows.map((row: any) => Object.values(row));
      }
    } else if (Array.isArray(reportData)) {
      // Direct array format
      if (reportData.length > 0) {
        headers = Object.keys(reportData[0]);
        rows = reportData.map((row: any) => Object.values(row));
      }
    } else if (typeof reportData === 'object') {
      // Object with various properties
      if (reportData.data && Array.isArray(reportData.data)) {
        if (reportData.data.length > 0) {
          headers = Object.keys(reportData.data[0]);
          rows = reportData.data.map((row: any) => Object.values(row));
        }
      }
      
      // Extract summary data
      const summaryKeys = ['totalSales', 'totalInvoices', 'averageInvoiceValue', 'totalReceivables', 'totalExpenses'];
      const summaryData: any = {};
      
      summaryKeys.forEach(key => {
        if (reportData[key] !== undefined) {
          summaryData[key] = reportData[key];
        }
      });
      
      if (Object.keys(summaryData).length > 0) {
        summary = summaryData;
      }
    }
    
    // Format headers to be more readable
    headers = headers.map(header => 
      header.replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
    );
    
    return {
      title,
      headers,
      rows,
      filters,
      summary
    };
  }
}
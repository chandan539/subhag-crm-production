import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface CertificateData {
  customerName: string;
  productName: string;
  serialNumber: string;
  certificateNumber: string;
  startDate: string;
  endDate: string;
}

export class PdfService {
  /**
   * Generates a PDF Certificate and pipes it directly to the Express Response stream.
   * Uses pdfkit for lightweight, fast generation.
   */
  static async generateCertificate(res: Response, data: CertificateData): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `SUBHAG Warranty Certificate - ${data.certificateNumber}`,
            Author: 'SUBHAG Industries'
          }
        });

        // Pipe directly to the HTTP response
        doc.pipe(res);

        // --- Design the PDF ---

        // Draw a nice border
        doc.rect(20, 20, 555, 800).lineWidth(3).strokeColor('#10B981').stroke();
        doc.rect(25, 25, 545, 790).lineWidth(1).strokeColor('#10B981').stroke();

        // Header
        doc.font('Helvetica-Bold')
           .fontSize(32)
           .fillColor('#065F46')
           .text('SUBHAG INDUSTRIES', 0, 80, { align: 'center' });

        doc.moveDown(0.5);
        
        doc.fontSize(20)
           .fillColor('#374151')
           .text('WARRANTY CERTIFICATE', { align: 'center' });

        doc.moveDown(2);

        // Decorative line
        doc.moveTo(100, 160).lineTo(495, 160).lineWidth(1).strokeColor('#E5E7EB').stroke();

        // Main Text
        doc.font('Helvetica')
           .fontSize(14)
           .fillColor('#4B5563')
           .text('This is to certify that the product listed below is protected under the official SUBHAG Industries warranty program.', 50, 200, {
             align: 'center',
             width: 495
           });

        doc.moveDown(3);

        // Customer Info
        const leftCol = 100;
        const rightCol = 280;
        let yPos = 300;

        const drawRow = (label: string, value: string) => {
          doc.font('Helvetica-Bold').fontSize(12).fillColor('#374151').text(label, leftCol, yPos);
          doc.font('Helvetica').fontSize(12).fillColor('#111827').text(value, rightCol, yPos);
          yPos += 30;
        };

        drawRow('Customer Name:', data.customerName);
        drawRow('Product Name:', data.productName);
        drawRow('Serial Number:', data.serialNumber);
        drawRow('Certificate No:', data.certificateNumber);
        
        yPos += 10;
        doc.moveTo(100, yPos - 15).lineTo(495, yPos - 15).lineWidth(1).strokeColor('#E5E7EB').stroke();
        
        drawRow('Warranty Start Date:', data.startDate);
        drawRow('Warranty End Date:', data.endDate);
        
        // Status badge
        yPos += 10;
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#374151').text('Status:', leftCol, yPos);
        
        // Green active pill
        doc.rect(rightCol, yPos - 2, 70, 18).fillAndStroke('#D1FAE5', '#10B981');
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#065F46').text('ACTIVE', rightCol + 15, yPos + 2);

        doc.moveDown(5);

        // Footer
        doc.font('Helvetica-Oblique')
           .fontSize(10)
           .fillColor('#9CA3AF')
           .text('This is a digitally generated certificate and requires no physical signature.', 50, 700, { align: 'center', width: 495 });
        
        doc.font('Helvetica')
           .fontSize(10)
           .text('SUBHAG Industries Support: https://warranty.subhag.in', 50, 720, { align: 'center', width: 495 });

        // Finalize PDF file
        doc.end();

        // Resolve when finished
        res.on('finish', () => {
          resolve();
        });
        
        res.on('error', (err) => {
          reject(err);
        });

      } catch (error) {
        reject(error);
      }
    });
  }
}

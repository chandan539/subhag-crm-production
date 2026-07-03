import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { z } from 'zod';
import { NotificationService } from '../services/notification.service';
import { PdfService } from '../services/pdf.service';

const activateWarrantySchema = z.object({
  serial_number: z.string(),
  customer: z.object({
    email: z.string().email().optional(),
    phone: z.string().min(5),
    first_name: z.string().min(2),
    last_name: z.string().optional(),
    address_line1: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional(),
    country: z.string().optional(),
  }),
  channel: z.enum(['PORTAL', 'QR', 'MANUAL']).default('PORTAL'),
  installation_date: z.string().optional(),
  invoice_date: z.string().optional(),
  invoice_number: z.string().optional(),
});

export const getWarranties = async (req: Request, res: Response): Promise<void> => {
  try {
    const warranties = await prisma.warranty.findMany({
      include: { serial_number: { include: { product: true } }, customer: true, certificate: true },
      take: 100,
    });
    res.json(warranties);
  } catch (error) {
    console.error('[API Error in ' + 'warranty.controller.ts' + ']:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getWarrantyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const warranty = await prisma.warranty.findUnique({
      where: { id },
      include: {
        serial_number: { include: { product: true } },
        customer: true,
        certificate: true,
      },
    });
    if (!warranty) {
      res.status(404).json({ error: 'Warranty not found' });
      return;
    }
    res.json(warranty);
  } catch (error) {
    console.error('[API Error in ' + 'warranty.controller.ts' + ']:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const activateWarranty = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = activateWarrantySchema.parse(req.body);
    
    const serial = await prisma.serialNumber.findUnique({
      where: { serial_number: parsed.serial_number },
      include: { product: true },
    });

    if (!serial) {
      res.status(404).json({ error: 'Serial number not found' });
      return;
    }

    if (serial.status !== 'AVAILABLE') {
      res.status(400).json({ error: `Serial number is already ${serial.status}` });
      return;
    }

    // Upsert Customer
    const customer = await prisma.customer.upsert({
      where: { phone: parsed.customer.phone },
      update: parsed.customer,
      create: { ...parsed.customer, phone: parsed.customer.phone },
    });

    // Check if User exists, if not create one and generate activation link
    let activationLink: string | undefined;
    if (parsed.customer.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: parsed.customer.email } });
      if (!existingUser) {
        // Generate a random secure password
        const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
        const password_hash = await require('bcryptjs').hash(randomPassword, 10);
        
        const newUser = await prisma.user.create({
          data: {
            email: parsed.customer.email,
            password_hash,
            first_name: parsed.customer.first_name,
            last_name: parsed.customer.last_name || '',
            phone: parsed.customer.phone,
            role: 'CUSTOMER', // Customer role for portal access
            status: 'INACTIVE', // Requires password set to activate
          }
        });

        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const token = require('jsonwebtoken').sign(
          { id: newUser.id, email: newUser.email },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        // Generate activation link (assuming frontend is hosted on the same domain/port in production)
        const frontendUrl = process.env.FRONTEND_URL || 'https://warranty.subhag.in';
        activationLink = `${frontendUrl}/activate-account?token=${token}`;
      }
    }

    // Calculate dates
    const start_date = parsed.installation_date ? new Date(parsed.installation_date) : (parsed.invoice_date ? new Date(parsed.invoice_date) : new Date());
    const end_date = new Date(start_date);
    end_date.setMonth(end_date.getMonth() + serial.product.base_warranty_months);

    const installation_date = parsed.installation_date ? new Date(parsed.installation_date) : null;
    const invoice_date = parsed.invoice_date ? new Date(parsed.invoice_date) : null;

    // Transaction to update serial status and create warranty
    const result = await prisma.$transaction(async (tx: any) => {
      await tx.serialNumber.update({
        where: { id: serial.id },
        data: { status: 'SOLD' },
      });

      const warranty = await tx.warranty.create({
        data: {
          serial_number_id: serial.id,
          customer_id: customer.id,
          start_date,
          end_date,
          status: 'ACTIVE',
          activation_channel: parsed.channel,
          installation_date,
          invoice_date,
          invoice_number: parsed.invoice_number,
        },
      });

      const certificate = await tx.warrantyCertificate.create({
        data: {
          warranty_id: warranty.id,
          certificate_number: `CERT-${warranty.id.substring(0, 8).toUpperCase()}`,
        },
      });

      return { warranty, certificate };
    });

    // Auto-trigger Webhook to Google Sheets
    try {
      const webhookSetting = await prisma.systemSetting.findUnique({
        where: { key: 'googleSheetWebhook' }
      });
      const webhookUrl = webhookSetting?.value || process.env.GOOGLE_SHEETS_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbyxJGUsd186Bd0h8jtmguJLXf3wG2TnfDd85O9S2Bybq6sJhlDmEKJDZwTVjm-vhBE4/exec';
      if (webhookUrl) {
        const payload = {
          exportType: 'warranties',
          data: [{
            Customer_Name: `${customer.first_name} ${customer.last_name || ''}`.trim(),
            Customer_Email: customer.email || '',
            Customer_Phone: customer.phone,
            Customer_Country: customer.country || 'India',
            Product_Name: serial.product.name,
            Serial_Number: serial.serial_number,
            Warranty_Status: 'ACTIVE',
            Start_Date: start_date.toISOString().split('T')[0],
            End_Date: end_date.toISOString().split('T')[0],
            Installation_Date: installation_date ? installation_date.toISOString().split('T')[0] : '',
            Invoice_Date: invoice_date ? invoice_date.toISOString().split('T')[0] : '',
            Invoice_Number: parsed.invoice_number || '',
            Certificate_Number: result.certificate.certificate_number,
          }]
        };

        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.error('[WEBHOOK_ERROR]:', err));
      }
    } catch (webhookErr) {
      console.error('[WEBHOOK_FETCH_ERROR]:', webhookErr);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://warranty.subhag.in';
    const certificateDownloadLink = `${frontendUrl}/certificate/${result.certificate.certificate_number}`;

    // Trigger WhatsApp & Email confirmation asynchronously
    NotificationService.triggerConfirmations({
      type: 'WARRANTY_ACTIVATION',
      customerName: `${customer.first_name} ${customer.last_name || ''}`.trim(),
      recipientEmail: customer.email || 'support@subhag.in',
      recipientPhone: customer.phone,
      productName: serial.product.name,
      serialNumber: serial.serial_number,
      activationLink,
      certificateDownloadLink, // pass this to notification service
    }).catch(err => console.error('[NOTIFICATION_TRIGGER_ERROR]:', err));

    res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const downloadCertificatePdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const certificate_number = req.params.certificate_number as string;
    const certificate = await prisma.warrantyCertificate.findFirst({
      where: { certificate_number },
      include: {
        warranty: {
          include: {
            customer: true,
            serial_number: { include: { product: true } }
          }
        }
      }
    });

    if (!certificate) {
      res.status(404).json({ error: 'Certificate not found' });
      return;
    }

    const { warranty } = certificate;
    
    // Set headers to trigger a download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=SUBHAG_Warranty_${certificate_number}.pdf`);

    // Stream PDF directly to client
    await PdfService.generateCertificate(res, {
      customerName: `${warranty.customer.first_name} ${warranty.customer.last_name || ''}`.trim(),
      productName: warranty.serial_number.product.name,
      serialNumber: warranty.serial_number.serial_number,
      certificateNumber: certificate.certificate_number,
      startDate: warranty.start_date.toISOString().split('T')[0],
      endDate: warranty.end_date.toISOString().split('T')[0],
    });

  } catch (error) {
    console.error('[PDF_GEN_ERROR]:', error);
    res.status(500).json({ error: 'Internal server error generating PDF' });
  }
};

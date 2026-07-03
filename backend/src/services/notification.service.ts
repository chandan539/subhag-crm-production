import { PrismaClient, RecipientType, NotificationChannel, NotificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface NotificationDetails {
  type: 'WARRANTY_ACTIVATION' | 'TICKET_CREATION' | 'TICKET_UPDATE';
  customerName: string;
  recipientEmail: string;
  recipientPhone: string;
  productName?: string;
  serialNumber?: string;
  ticketNumber?: string;
  statusLabel?: string;
  issueDescription?: string;
  activationLink?: string;
  certificateDownloadLink?: string;
}

export class NotificationService {
  /**
   * Dispatches Email and WhatsApp confirmations for a CRM event
   */
  static async triggerConfirmations(details: NotificationDetails) {
    const { type, customerName, recipientEmail, recipientPhone } = details;

    let emailTitle = '';
    let emailContent = '';
    let whatsappContent = '';

    if (type === 'WARRANTY_ACTIVATION') {
      emailTitle = 'Your SUBHAG Product Warranty is Activated!';
      
      let extraContent = '\n\nYou can view your digital certificate in the customer portal at any time.';
      if (details.activationLink) {
        extraContent = `\n\nWe have automatically created a customer portal account for you. Please click the link below to set your password and access your digital warranty certificate:\n${details.activationLink}`;
      }
      if (details.certificateDownloadLink) {
        extraContent += `\n\nDownload your PDF Certificate directly here: ${details.certificateDownloadLink}`;
      }

      emailContent = `Hello ${customerName},\n\nWe are pleased to inform you that your warranty for the product "${details.productName || 'Appliance'}" (Serial Number: ${details.serialNumber || 'N/A'}) has been successfully registered and activated.${extraContent}\n\nThank you for choosing SUBHAG.\n\nBest regards,\nSUBHAG Support Team`;
      
      whatsappContent = `*SUBHAG Ind. - Warranty Activated* \n\nHello ${customerName}, your warranty for *${details.productName || 'Appliance'}* (S/N: ${details.serialNumber || 'N/A'}) is now ACTIVE. Access certificate details: https://warranty.subhag.in/portal\n\nDownload PDF Certificate: ${details.certificateDownloadLink || 'N/A'}`;
    } else if (type === 'TICKET_CREATION') {
      emailTitle = `Support Request Filed: ${details.ticketNumber}`;
      emailContent = `Hello ${customerName},\n\nWe have received your service request. A new support ticket (${details.ticketNumber}) has been created.\n\nIssue details:\n"${details.issueDescription || ''}"\n\nOur engineers will review and contact you shortly to schedule an inspection.\n\nBest regards,\nSUBHAG CRM Team`;

      whatsappContent = `*SUBHAG Service* \n\nHello ${customerName}, support request *${details.ticketNumber}* has been successfully opened. Our technical engineers are reviewing your request.`;
    } else if (type === 'TICKET_UPDATE') {
      emailTitle = `Ticket Update: ${details.ticketNumber}`;
      emailContent = `Hello ${customerName},\n\nYour support ticket ${details.ticketNumber} status has been updated to: **${details.statusLabel || 'UPDATED'}**.\n\nLog in to your portal dashboard for further details.\n\nBest regards,\nSUBHAG Support`;

      whatsappContent = `*SUBHAG Ticket Update* \n\nHello ${customerName}, your ticket *${details.ticketNumber}* status is now *${details.statusLabel || 'UPDATED'}*. Details: https://warranty.subhag.in/portal`;
    }

    // 1. Dispatch Email Log
    let emailStatus: NotificationStatus = NotificationStatus.PENDING;
    try {
      let brevoApiKey = process.env.BREVO_API_KEY || '';
      try {
        const setting = await prisma.systemSetting.findUnique({ where: { key: 'brevoApiKey' } });
        if (setting && setting.value) brevoApiKey = setting.value;
      } catch (e) {}

      if (brevoApiKey) {
        const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': brevoApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            sender: { email: 'no-reply@subhag.in', name: 'SUBHAG Support' },
            to: [{ email: recipientEmail, name: customerName }],
            subject: emailTitle,
            textContent: emailContent
          })
        });

        if (!brevoResponse.ok) {
          const errorData = await brevoResponse.text();
          console.error('[BREVO ERROR]', errorData);
          emailStatus = NotificationStatus.FAILED;
        } else {
          emailStatus = NotificationStatus.SENT;
          console.log(`\x1b[36m[EMAIL DISPATCH SUCCESS] To: ${recipientEmail} | Subject: "${emailTitle}"\x1b[0m`);
        }
      } else {
        console.warn('[EMAIL WARNING] BREVO_API_KEY is not set. Simulating success.');
        emailStatus = NotificationStatus.SENT;
      }
    } catch (err) {
      console.error('[EMAIL DISPATCH EXCEPTION]:', err);
      emailStatus = NotificationStatus.FAILED;
    } finally {
      try {
        await prisma.notification.create({
          data: {
            recipient_id: '00000000-0000-0000-0000-000000000000', // System / Customer Reference
            recipient_type: RecipientType.CUSTOMER,
            channel: NotificationChannel.EMAIL,
            type: type,
            title: emailTitle,
            content: emailContent,
            status: emailStatus,
            sent_at: new Date(),
          },
        });
      } catch (logErr) {
        console.error('[EMAIL DB LOG ERROR]:', logErr);
      }
    }

    // 2. Dispatch WhatsApp Log
    let waStatus: NotificationStatus = NotificationStatus.PENDING;
    try {
      let cheerioApiKey = process.env.CHEERIO_API_KEY || 'e9ea7cf22309bebd693037b8b52624a40f90996ea67758cc0bdd9768489e7f2d';
      let workflowId = process.env.CHEERIO_WORKFLOW_ID || 'your_workflow_id_here';
      try {
        const keySetting = await prisma.systemSetting.findUnique({ where: { key: 'cheerioApiKey' } });
        if (keySetting && keySetting.value) cheerioApiKey = keySetting.value;
        const workflowSetting = await prisma.systemSetting.findUnique({ where: { key: 'cheerioWorkflowId' } });
        if (workflowSetting && workflowSetting.value) workflowId = workflowSetting.value;
      } catch (e) {}

      if (cheerioApiKey) {
        // Strip non-digits and ensure country code exists (assuming India 91 if length is 10)
        let formattedPhone = recipientPhone.replace(/\D/g, '');
        if (formattedPhone.length === 10) formattedPhone = '91' + formattedPhone;

        const cheerioResponse = await fetch('https://newprod.api.cheerio.in/direct-apis/v1/manualTriggerWorkflow', {
          method: 'POST',
          headers: {
            'x-api-key': cheerioApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phoneNumber: formattedPhone,
            userName: customerName,
            workflowId: workflowId,
            otherData: {
              productName: details.productName || 'Appliance',
              serialNumber: details.serialNumber || 'N/A',
              activationLink: details.activationLink || 'https://warranty.subhag.in/portal',
              certificateDownloadLink: details.certificateDownloadLink || ''
            }
          })
        });

        if (!cheerioResponse.ok) {
          const errorData = await cheerioResponse.text();
          console.error('[CHEERIO ERROR]', errorData);
          waStatus = NotificationStatus.FAILED;
        } else {
          waStatus = NotificationStatus.SENT;
          console.log(`\x1b[32m[WHATSAPP DISPATCH SUCCESS] To: ${formattedPhone} via Workflow: ${workflowId}\x1b[0m`);
        }
      } else {
        console.warn('[WHATSAPP WARNING] CHEERIO_API_KEY is not set. Simulating success.');
        waStatus = NotificationStatus.SENT;
      }
    } catch (err) {
      console.error('[WHATSAPP DISPATCH EXCEPTION]:', err);
      waStatus = NotificationStatus.FAILED;
    } finally {
      try {
        await prisma.notification.create({
          data: {
            recipient_id: '00000000-0000-0000-0000-000000000000',
            recipient_type: RecipientType.CUSTOMER,
            channel: NotificationChannel.WHATSAPP,
            type: type,
            title: `WhatsApp Alert: ${type}`,
            content: whatsappContent,
            status: waStatus,
            sent_at: new Date(),
          },
        });
      } catch (logErr) {
        console.error('[WHATSAPP DB LOG ERROR]:', logErr);
      }
    }
  }
}

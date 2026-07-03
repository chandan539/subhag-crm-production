import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { z } from 'zod';
import { NotificationService } from '../services/notification.service';

const createTicketSchema = z.object({
  customer_id: z.string().uuid(),
  warranty_id: z.string().uuid().optional(),
  issue_description: z.string().min(10),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
});

const assignTicketSchema = z.object({
  engineer_id: z.string().uuid(),
});

const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED']),
  resolution_notes: z.string().optional(),
});

export const getTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, engineer_id } = req.query;
    const filter: any = {};
    if (status) filter.status = String(status);
    if (engineer_id) filter.engineer_id = String(engineer_id);

    const tickets = await prisma.serviceTicket.findMany({
      where: filter,
      include: {
        customer: true,
        warranty: {
          include: {
            serial_number: {
              include: {
                product: true,
              },
            },
          },
        },
        engineer: { include: { user: { select: { first_name: true, last_name: true } } } },
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
    res.json(tickets);
  } catch (error) {
    console.error('[API Error in ' + 'ticket.controller.ts' + ']:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTicketById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const ticket = await prisma.serviceTicket.findUnique({
      where: { id },
      include: {
        customer: true,
        warranty: { include: { serial_number: { include: { product: true } } } },
        engineer: { include: { user: { select: { first_name: true, last_name: true } } } },
      },
    });
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    res.json(ticket);
  } catch (error) {
    console.error('[API Error in ' + 'ticket.controller.ts' + ']:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createTicketSchema.parse(req.body);
    
    // Check if customer exists
    const customer = await prisma.customer.findUnique({ where: { id: parsed.customer_id } });
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const ticket_number = `TKT-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const ticket = await prisma.serviceTicket.create({
      data: {
        ticket_number,
        ...parsed,
      },
    });

    // Trigger WhatsApp & Email confirmation asynchronously
    NotificationService.triggerConfirmations({
      type: 'TICKET_CREATION',
      customerName: `${customer.first_name} ${customer.last_name || ''}`.trim(),
      recipientEmail: customer.email || 'support@subhag.in',
      recipientPhone: customer.phone,
      ticketNumber: ticket.ticket_number,
      issueDescription: ticket.issue_description,
    }).catch(err => console.error('[NOTIFICATION_TRIGGER_ERROR]:', err));

    res.status(201).json(ticket);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const assignEngineer = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = assignTicketSchema.parse(req.body);
    
    const engineer = await prisma.engineer.findUnique({ where: { id: parsed.engineer_id } });
    if (!engineer) {
      res.status(404).json({ error: 'Engineer not found' });
      return;
    }

    const id = req.params.id as string;
    const ticket = await prisma.serviceTicket.update({
      where: { id },
      data: {
        engineer_id: parsed.engineer_id,
        status: 'ASSIGNED',
      },
      include: { customer: true },
    });

    // Trigger WhatsApp & Email confirmation asynchronously
    NotificationService.triggerConfirmations({
      type: 'TICKET_UPDATE',
      customerName: `${ticket.customer.first_name} ${ticket.customer.last_name || ''}`.trim(),
      recipientEmail: ticket.customer.email || 'support@subhag.in',
      recipientPhone: ticket.customer.phone,
      ticketNumber: ticket.ticket_number,
      statusLabel: 'ASSIGNED',
    }).catch(err => console.error('[NOTIFICATION_TRIGGER_ERROR]:', err));

    res.json(ticket);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const updateTicketStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = updateTicketSchema.parse(req.body);
    
    const updateData: any = {
      status: parsed.status,
      resolution_notes: parsed.resolution_notes,
    };

    if (parsed.status === 'RESOLVED') {
      updateData.resolved_at = new Date();
    } else if (parsed.status === 'CLOSED') {
      updateData.closed_at = new Date();
    }

    const id = req.params.id as string;
    const ticket = await prisma.serviceTicket.update({
      where: { id },
      data: updateData,
      include: { customer: true },
    });

    // Trigger WhatsApp & Email confirmation asynchronously
    NotificationService.triggerConfirmations({
      type: 'TICKET_UPDATE',
      customerName: `${ticket.customer.first_name} ${ticket.customer.last_name || ''}`.trim(),
      recipientEmail: ticket.customer.email || 'support@subhag.in',
      recipientPhone: ticket.customer.phone,
      ticketNumber: ticket.ticket_number,
      statusLabel: ticket.status,
    }).catch(err => console.error('[NOTIFICATION_TRIGGER_ERROR]:', err));

    res.json(ticket);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

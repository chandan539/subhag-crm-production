import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalCustomers = await prisma.customer.count();
    const activeWarranties = await prisma.warranty.count({ where: { status: 'ACTIVE' } });
    const openTickets = await prisma.serviceTicket.count({ where: { status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ESCALATED'] } } });
    const activeAmcs = await prisma.amcContract.count({ where: { status: 'ACTIVE' } });

    res.json({
      total_customers: totalCustomers,
      active_warranties: activeWarranties,
      open_tickets: openTickets,
      active_amcs: activeAmcs,
    });
  } catch (error) {
    console.error('[API Error in ' + 'analytics.controller.ts' + ']:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getWarrantiesByProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await prisma.warranty.groupBy({
      by: ['serial_number_id'],
      _count: true,
    });
    // For a real app, this would be a more complex join to group by product instead of serial_number_id
    res.json(data);
  } catch (error) {
    console.error('[API Error in ' + 'analytics.controller.ts' + ']:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTicketsByStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await prisma.serviceTicket.groupBy({
      by: ['status'],
      _count: true,
    });
    res.json(data);
  } catch (error) {
    console.error('[API Error in ' + 'analytics.controller.ts' + ']:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

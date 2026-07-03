import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { created_at: 'desc' },
      take: 200,
    });
    res.json(notifications);
  } catch (error) {
    console.error('[API Error in ' + 'notification.controller.ts' + ']:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

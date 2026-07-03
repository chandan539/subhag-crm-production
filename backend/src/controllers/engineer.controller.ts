import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const getEngineers = async (req: Request, res: Response): Promise<void> => {
  try {
    const engineers = await prisma.engineer.findMany({
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
          },
        },
      },
      where: { is_available: true },
    });
    res.json(engineers);
  } catch (error) {
    console.error('[API Error in ' + 'engineer.controller.ts' + ']:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

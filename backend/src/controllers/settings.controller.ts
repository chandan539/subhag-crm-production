import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await prisma.systemSetting.findMany();
    // Format as a simple key-value object
    const formatted = settings.reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json(formatted);
  } catch (error) {
    console.error('[API Error in ' + 'settings.controller.ts' + ']:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settingsObj = req.body;
    
    // Upsert each key in parallel
    await Promise.all(
      Object.keys(settingsObj).map((key) =>
        prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(settingsObj[key]) },
          create: { key, value: String(settingsObj[key]) },
        })
      )
    );

    res.json({ message: 'Configuration saved successfully' });
  } catch (error) {
    console.error('[API Error in ' + 'settings.controller.ts' + ']:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

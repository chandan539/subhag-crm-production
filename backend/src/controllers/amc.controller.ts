import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { z } from 'zod';

const createAmcSchema = z.object({
  customer_id: z.string().uuid(),
  warranty_id: z.string().uuid(),
  duration_months: z.number().int().positive(),
  value: z.number().positive(),
  start_date: z.string().optional(),
});

export const getAmcContracts = async (req: Request, res: Response): Promise<void> => {
  try {
    const contracts = await prisma.amcContract.findMany({
      include: {
        customer: true,
        warranty: { include: { serial_number: { include: { product: true } } } },
      },
      take: 100,
    });
    res.json(contracts);
  } catch (error) {
    console.error('[API Error in ' + 'amc.controller.ts' + ']:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAmcById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const contract = await prisma.amcContract.findUnique({
      where: { id },
      include: {
        customer: true,
        warranty: { include: { serial_number: { include: { product: true } } } },
      },
    });
    if (!contract) {
      res.status(404).json({ error: 'AMC Contract not found' });
      return;
    }
    res.json(contract);
  } catch (error) {
    console.error('[API Error in ' + 'amc.controller.ts' + ']:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createAmc = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createAmcSchema.parse(req.body);
    
    const start_date = parsed.start_date ? new Date(parsed.start_date) : new Date();
    const end_date = new Date(start_date);
    end_date.setMonth(end_date.getMonth() + parsed.duration_months);

    const contract_number = `AMC-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const contract = await prisma.amcContract.create({
      data: {
        customer_id: parsed.customer_id,
        warranty_id: parsed.warranty_id,
        contract_number,
        start_date,
        end_date,
        value: parsed.value,
        status: 'ACTIVE',
      },
    });

    res.status(201).json(contract);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const renewAmc = async (req: Request, res: Response): Promise<void> => {
  try {
    const renewSchema = z.object({
      duration_months: z.number().int().positive(),
      value: z.number().positive(),
    });
    const parsed = renewSchema.parse(req.body);

    const id = req.params.id as string;
    const existingContract = await prisma.amcContract.findUnique({
      where: { id },
    });

    if (!existingContract) {
      res.status(404).json({ error: 'AMC Contract not found' });
      return;
    }

    const start_date = existingContract.end_date > new Date() ? existingContract.end_date : new Date();
    const end_date = new Date(start_date);
    end_date.setMonth(end_date.getMonth() + parsed.duration_months);

    // Update existing to EXPIRED
    await prisma.amcContract.update({
      where: { id },
      data: { status: 'EXPIRED' },
    });

    const contract_number = `AMC-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create new contract
    const newContract = await prisma.amcContract.create({
      data: {
        customer_id: existingContract.customer_id,
        warranty_id: existingContract.warranty_id,
        contract_number,
        start_date,
        end_date,
        value: parsed.value,
        status: 'ACTIVE',
      },
    });

    res.status(201).json(newContract);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

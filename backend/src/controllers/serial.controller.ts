import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { z } from 'zod';

const generateSerialSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive().max(10000),
  batch_number: z.string().min(1),
  manufacturing_date: z.string().optional(), // ISO date string
});

const manualSerialSchema = z.object({
  product_id: z.string().uuid(),
  serial_numbers: z.array(z.string().min(1)),
  batch_number: z.string().min(1),
  manufacturing_date: z.string().optional(),
});

export const getSerials = async (req: Request, res: Response): Promise<void> => {
  try {
    const { product_id, status } = req.query;
    const filter: any = {};
    if (product_id) filter.product_id = String(product_id);
    if (status) filter.status = String(status);

    const serials = await prisma.serialNumber.findMany({
      where: filter,
      include: { product: true },
      take: 100, // Limit for pagination in real app
    });
    res.json(serials);
  } catch (error) {
    console.error('[API Error in ' + 'serial.controller.ts' + ']:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSerialById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const serial = await prisma.serialNumber.findUnique({
      where: { id },
      include: { product: true, warranty: true },
    });
    if (!serial) {
      res.status(404).json({ error: 'Serial not found' });
      return;
    }
    res.json(serial);
  } catch (error) {
    console.error('[API Error in ' + 'serial.controller.ts' + ']:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const generateSerials = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = generateSerialSchema.parse(req.body);
    const product = await prisma.product.findUnique({ where: { id: parsed.product_id } });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Prefix logic: WM-24-XXXX
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = `${product.category.substring(0, 2).toUpperCase()}-${year}`;

    // Shorten serial numbers by using a shorter random string
    // Make the unique code 4 characters long (instead of 6) to keep serial numbers shorter
    const generateUniqueCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();

    const serialsToCreate = Array.from({ length: parsed.quantity }).map((_, i) => ({
      product_id: parsed.product_id,
      serial_number: `${prefix}-${generateUniqueCode()}`,
      batch_number: parsed.batch_number,
      manufacturing_date: parsed.manufacturing_date ? new Date(parsed.manufacturing_date) : new Date(),
    }));

    const created = await prisma.serialNumber.createMany({
      data: serialsToCreate,
      skipDuplicates: true,
    });

    res.status(201).json({ message: `Successfully generated ${created.count} serial numbers` });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const updateSerialStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = z.object({ status: z.enum(['AVAILABLE', 'SOLD', 'DEFECTIVE', 'RETURNED']) }).parse(req.body);
    const serial = await prisma.serialNumber.update({
      where: { id },
      data: { status },
    });
    res.json(serial);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const addManualSerials = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = manualSerialSchema.parse(req.body);
    const product = await prisma.product.findUnique({ where: { id: parsed.product_id } });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const serialsToCreate = parsed.serial_numbers.map(sn => ({
      product_id: parsed.product_id,
      serial_number: sn,
      batch_number: parsed.batch_number,
      manufacturing_date: parsed.manufacturing_date ? new Date(parsed.manufacturing_date) : new Date(),
    }));

    const created = await prisma.serialNumber.createMany({
      data: serialsToCreate,
      skipDuplicates: true, // Existing manual serials will be skipped
    });

    res.status(201).json({ message: `Successfully added ${created.count} manual serial numbers` });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

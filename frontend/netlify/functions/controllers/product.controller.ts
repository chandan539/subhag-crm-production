import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { z } from 'zod';

const createProductSchema = z.object({
  sku: z.string().min(3),
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.string().min(2),
  base_warranty_months: z.number().int().positive(),
  price: z.number().positive(),
});

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    console.error('[API Error in ' + 'product.controller.ts' + ']:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (error) {
    console.error('[API Error in ' + 'product.controller.ts' + ']:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createProductSchema.parse(req.body);
    const existing = await prisma.product.findUnique({ where: { sku: parsed.sku } });
    
    if (existing) {
      res.status(409).json({ error: 'SKU already exists' });
      return;
    }

    const product = await prisma.product.create({
      data: parsed,
    });
    res.status(201).json(product);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createProductSchema.partial().parse(req.body);
    const id = req.params.id as string;
    const product = await prisma.product.update({
      where: { id },
      data: parsed,
    });
    res.json(product);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

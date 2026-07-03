import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { z } from 'zod';

const updateCustomerSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
});

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        _count: {
          select: {
            warranties: true,
            service_tickets: true,
            amc_contracts: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
    res.json(customers);
  } catch (error) {
    console.error('[API Error in getCustomers]:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        warranties: {
          include: {
            serial_number: {
              include: {
                product: true,
              },
            },
          },
        },
        service_tickets: {
          orderBy: { created_at: 'desc' },
        },
        amc_contracts: true,
      },
    });

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    res.json(customer);
  } catch (error) {
    console.error('[API Error in getCustomerById]:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const parsed = updateCustomerSchema.parse(req.body);

    const customer = await prisma.customer.update({
      where: { id },
      data: parsed,
    });

    res.json({ message: 'Customer updated successfully', customer });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues });
    } else {
      console.error('[API Error in updateCustomer]:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

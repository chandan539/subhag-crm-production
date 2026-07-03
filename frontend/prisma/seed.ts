import { prisma } from '../netlify/functions/config/prisma';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'chandan@subhag.in' },
    update: {},
    create: {
      email: 'chandan@subhag.in',
      password_hash: adminPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: 'ADMIN',
    },
  });

  // Create customer
  const customerUser = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      password_hash: await bcrypt.hash('customer123', 10),
      first_name: 'John',
      last_name: 'Doe',
      role: 'SUPPORT', // since USER is not in Role enum (ADMIN, MANAGER, SUPPORT)
      phone: '1234567890',
    },
  });

  const customerProfile = await prisma.customer.upsert({
    where: { phone: '1234567890' },
    update: {},
    create: {
      first_name: 'John',
      last_name: 'Doe',
      phone: '1234567890',
      email: 'john@example.com',
      address_line1: '123 Main St',
      city: 'Metropolis',
      state: 'NY',
      zip_code: '10001',
      country: 'USA',
    },
  });

  // Create products
  const product = await prisma.product.upsert({
    where: { sku: 'WM-24X' },
    update: {},
    create: {
      sku: 'WM-24X',
      name: 'Professional Washer X1',
      description: 'Heavy duty washing machine',
      category: 'Washing Machines',
      price: 1299.00,
      base_warranty_months: 24,
      status: 'ACTIVE',
    },
  });

  // Create serial numbers
  const serial = await prisma.serialNumber.upsert({
    where: { serial_number: 'WM-24-X89211' },
    update: {},
    create: {
      serial_number: 'WM-24-X89211',
      product_id: product.id,
      status: 'SOLD',
    },
  });

  // Create warranty
  const today = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(today.getFullYear() + 2);

  const warranty = await prisma.warranty.upsert({
    where: { serial_number_id: serial.id },
    update: {},
    create: {
      serial_number_id: serial.id,
      customer_id: customerProfile.id,
      start_date: today,
      end_date: nextYear,
      status: 'ACTIVE',
      activation_channel: 'MANUAL',
    },
  });
  
  await prisma.warrantyCertificate.upsert({
    where: { warranty_id: warranty.id },
    update: {},
    create: {
      warranty_id: warranty.id,
      certificate_number: 'CERT-' + warranty.id.substring(0, 8).toUpperCase(),
      pdf_url: 'https://example.com/cert.pdf'
    }
  });

  // Create a ticket
  const ticket = await prisma.serviceTicket.upsert({
    where: { ticket_number: 'TKT-102938' },
    update: {},
    create: {
      ticket_number: 'TKT-102938',
      warranty_id: warranty.id,
      customer_id: customerProfile.id,
      issue_description: 'The washer makes a very loud grinding noise during the spin cycle.',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

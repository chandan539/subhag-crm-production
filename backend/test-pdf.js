const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const cert = await prisma.warrantyCertificate.findFirst({
    include: {
      warranty: {
        include: { customer: true, serial_number: { include: { product: true } } }
      }
    }
  });
  console.log(cert ? cert.certificate_number : 'No certificate found');
}
main().finally(() => prisma.$disconnect());

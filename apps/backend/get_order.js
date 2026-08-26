const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.order.findFirst({ orderBy: { createdAt: 'desc' } })
  .then(console.log)
  .finally(() => prisma.$disconnect());

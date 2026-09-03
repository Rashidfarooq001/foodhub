const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const order = await prisma.order.findUnique({ where: { id: '106516f1-7980-4908-b2f3-71ed68846454' } });
  console.log(order.pricingSnapshot);
  await prisma.$disconnect();
}
run();

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const yesterday = new Date(Date.now() - 24*60*60*1000);
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: yesterday } }
  });
  console.log(JSON.stringify(orders, null, 2));
}
run();

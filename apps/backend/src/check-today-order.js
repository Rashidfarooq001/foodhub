require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const today = new Date();
  today.setHours(0,0,0,0);
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: today } }
  });
  console.log(JSON.stringify(orders, null, 2));
}
run();

require('dotenv').config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const order = await prisma.order.findFirst({
    where: { orderNumber: 'FH-198803' },
    include: { deliveryJob: true },
  });
  console.log(JSON.stringify(order, null, 2));
}
run();

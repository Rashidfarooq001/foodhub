const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl:
    'postgresql://neondb_owner:npg_iK4pyqYjFOb0@ep-empty-block-ayeiv0ux.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require',
});

async function run() {
  console.log('--- TEST #FH-946620 ---');
  let order = await prisma.order.findFirst({
    where: { orderNumber: '#FH-946620' },
  });

  if (order) {
    console.log(`Order ID: ${order.id}`);
    console.log(`Status: ${order.status}`);
  } else {
    console.log('Order #FH-946620 not found.');
  }

  await prisma.$disconnect();
}

run();

const { PrismaClient } = require('@prisma/client');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL environment variable is required to run test-accept-direct.js');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

async function runTrace() {
  console.log('=== DIRECT DATABASE TRACE OF ORDER TRANSITION ===');
  try {
    const orderId = 'eaf99d39-d299-4694-b947-a920684a82a6';
    const userId = '39bf0909-da74-4f23-85a3-c4ed98efad4c';

    console.log('1. Querying order...');
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true, customer: true, deliveryJob: true },
    });

    if (!order) {
      console.log('❌ Order not found!');
      return;
    }
    console.log('✅ Order found:', { id: order.id, status: order.status, restaurantId: order.restaurantId });

    console.log('2. Running $transaction status update to ACCEPTED...');
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.order.update({
        where: { id: order.id },
        data: { status: 'ACCEPTED' },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: 'ACCEPTED',
          changedBy: userId,
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: 'ACCEPTED',
          message: 'Restaurant accepted your order.',
        },
      });

      return u;
    });

    console.log('🎉 SUCCESS! Order status updated to:', updated.status);
  } catch (err) {
    console.error('❌ DIRECT DB TRACE EXCEPTION:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTrace();

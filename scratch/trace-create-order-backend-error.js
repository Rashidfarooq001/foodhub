const { PrismaClient } = require('@prisma/client');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL environment variable is required to run trace-create-order-backend-error.js');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

async function traceOrderTransition() {
  console.log('=== FORENSIC STEP-BY-STEP TRACE OF DB TRANSITION ===\n');

  try {
    const orderId = 'eaf99d39-d299-4694-b947-a920684a82a6';
    const userId = '39bf0909-da74-4f23-85a3-c4ed98efad4c';

    console.log('Step 1: Finding order in database...');
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: true,
        customer: true,
        deliveryJob: true,
      },
    });

    if (!order) {
      console.log('❌ Order not found!');
      return;
    }
    console.log('✅ Order found:', {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      restaurantId: order.restaurantId,
      restaurantOwnerId: order.restaurant?.ownerId,
    });

    console.log('\nStep 2: Testing Order.update inside transaction...');
    const txResult = await prisma.$transaction(async (tx) => {
      console.log('  a. Updating order status to ACCEPTED...');
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: 'ACCEPTED' },
        include: {
          restaurant: true,
          deliveryJob: true,
          orderItems: { include: { foodItem: true } },
        },
      });
      console.log('  ✅ Order updated successfully to ACCEPTED');

      console.log('  b. Creating OrderStatusHistory...');
      try {
        const history = await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: 'ACCEPTED',
            changedBy: userId,
          },
        });
        console.log('  ✅ OrderStatusHistory created:', history.id);
      } catch (histErr) {
        console.error('  ❌ FAILED to create OrderStatusHistory:', histErr);
        throw histErr;
      }

      console.log('  c. Creating OrderTimeline...');
      try {
        const timeline = await tx.orderTimeline.create({
          data: {
            orderId: order.id,
            status: 'ACCEPTED',
            message: 'Restaurant accepted your order.',
          },
        });
        console.log('  ✅ OrderTimeline created:', timeline.id);
      } catch (timeErr) {
        console.error('  ❌ FAILED to create OrderTimeline:', timeErr);
        throw timeErr;
      }

      return updatedOrder;
    });

    console.log('\n🎉 TRANSACTION COMPLETED SUCCESSFULLY!', txResult.status);
  } catch (err) {
    console.error('\n❌ CAUGHT EXCEPTION IN STEP-BY-STEP TRACE:');
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

traceOrderTransition();

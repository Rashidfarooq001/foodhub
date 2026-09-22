const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const orderId = '03434c0b-f365-45e5-b67b-e879f3f79276';
  
  // Fake the lifecycle service behavior for READY_FOR_PICKUP
  const order = await p.order.findUnique({
    where: { id: orderId },
    include: { restaurant: true, customer: true, deliveryJob: true }
  });
  
  const currentStatus = order.status;
  const targetStatus = 'READY_FOR_PICKUP';
  
  // Transition check
  const allowedTransitions = {
        PREPARING: [
          'READY_FOR_PICKUP',
          'DRIVER_ASSIGNED',
          'OUT_FOR_DELIVERY',
          'CANCELLED',
        ],
  };
  
  if (!allowedTransitions[currentStatus]?.includes(targetStatus)) {
    console.log("Not allowed!");
    return;
  }
  
  const updated = await p.order.update({
    where: { id: order.id },
    data: { status: targetStatus }
  });
  
  console.log("Transitioned to:", updated.status);
}
main().catch(console.error).finally(() => p.$disconnect());

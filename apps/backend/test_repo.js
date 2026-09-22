const http = require('http');
// Need an admin token or something to call the API
// Let's just mock the service call directly

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const rest = await p.restaurant.findFirst({ select: { id: true } });
  
  const status = 'PENDING,ACCEPTED,PREPARING,READY_FOR_PICKUP';
  let statusFilter = undefined;
  if (typeof status === 'string' && status.includes(',')) {
    statusFilter = { in: status.split(',').map((s) => s.trim()) };
  } else if (status) {
    statusFilter = status;
  }
  
  const orders = await p.order.findMany({
    where: {
      restaurantId: rest.id,
      ...(statusFilter ? { status: statusFilter } : {}),
      deletedAt: null,
    },
    select: { id: true, status: true, orderNumber: true }
  });
  
  console.log("Orders returned by repo:", orders);
}
main().catch(console.error).finally(() => p.$disconnect());

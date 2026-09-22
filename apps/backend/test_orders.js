const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const q = await p.order.findMany({
    where: {
      status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'] }
    },
    select: { id: true, status: true }
  });
  console.log("Found orders:", q.length);
  
  // Let's check how many are READY_FOR_PICKUP
  const ready = await p.order.findMany({
    where: { status: 'READY_FOR_PICKUP' }
  });
  console.log("Ready orders:", ready.length);
}
main().catch(console.error).finally(() => p.$disconnect());

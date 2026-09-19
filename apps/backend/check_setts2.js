const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const s = await p.restaurantSettlement.findMany({
    include: { restaurant: { select: { name: true } }, order: { select: { createdAt: true, orderNumber: true } } },
    orderBy: { createdAt: 'desc' }
  });
  // Group by restaurant
  const byRest = {};
  for (const x of s) {
    const rn = x.restaurant?.name || '?';
    if (!byRest[rn]) byRest[rn] = [];
    byRest[rn].push({ status: x.status, net: x.netPayable?.toString(), settledAt: x.settledAt, orderId: x.orderId.slice(0,8), orderNum: x.order?.orderNumber });
  }
  console.log(JSON.stringify(byRest, null, 2));
}
main().catch(console.error).finally(() => p.$disconnect());

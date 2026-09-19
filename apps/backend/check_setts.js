const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const s = await p.restaurantSettlement.findMany({
    take: 3,
    include: { order: { select: { createdAt: true, orderNumber: true, status: true } }, restaurant: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  });
  for (const x of s) {
    console.log(JSON.stringify({
      id: x.id, restaurant: x.restaurant?.name, order: x.order?.orderNumber,
      orderCreatedAt: x.order?.createdAt,
      orderStatus: x.order?.status,
      grossAmount: x.grossAmount?.toString(), netPayable: x.netPayable?.toString(),
      commissionAmount: x.commissionAmount?.toString(), commissionGst: x.commissionGst?.toString(),
      status: x.status, settledAt: x.settledAt, utrNumber: x.utrNumber,
      periodStart: x.periodStart, periodEnd: x.periodEnd
    }, null, 2));
  }
}
main().catch(console.error).finally(() => p.$disconnect());

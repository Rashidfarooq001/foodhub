const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const paidSettlements = await p.restaurantSettlement.findMany({
    where: { status: 'PAID' },
  });

  console.log(`Checking ${paidSettlements.length} paid settlements...`);
  let missing = 0;

  for (const s of paidSettlements) {
    const existing = await p.settlementInvoice.findFirst({
      where: {
        restaurantId: s.restaurantId,
        periodStart: { lte: s.periodStart },
        periodEnd: { gte: s.periodEnd }
      }
    });

    if (!existing) {
      missing++;
      console.log(`Missing invoice for restaurant ${s.restaurantId} around ${s.periodStart}`);
    }
  }
  
  console.log(`Total missing: ${missing}`);
}

main().catch(console.error).finally(() => p.$disconnect());

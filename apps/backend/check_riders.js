const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const paidSettlements = await p.riderSettlement.findMany({
    where: { status: 'PAID' },
  });

  console.log(`Found ${paidSettlements.length} paid rider settlements.`);
}

main().catch(console.error).finally(() => p.$disconnect());

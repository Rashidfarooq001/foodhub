const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const rest = await p.restaurant.findFirst({ where: { name: 'twinlight' } });
  const setts = await p.restaurantSettlement.findMany({ where: { restaurantId: rest.id } });
  console.log("twinlight setts:", setts);
}
main().catch(console.error).finally(() => p.$disconnect());

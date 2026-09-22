const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const rests = await p.restaurant.findMany({ select: { name: true } });
  console.log("Restaurants:", rests);
}
main().catch(console.error).finally(() => p.$disconnect());

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  await p.restaurant.updateMany({ data: { costForTwo: null } });
  console.log("Cleared costForTwo for all restaurants");
}
main().finally(() => p.$disconnect());

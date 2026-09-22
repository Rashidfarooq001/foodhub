const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  await p.restaurant.updateMany({ where: { name: { contains: 'twinlight', mode: 'insensitive' } }, data: { costForTwo: 100 } });
  await p.restaurant.updateMany({ where: { name: { contains: 'pizza hub', mode: 'insensitive' } }, data: { costForTwo: 250 } });
  await p.restaurant.updateMany({ where: { name: { contains: 'spice villa', mode: 'insensitive' } }, data: { costForTwo: 500 } });
  console.log("Updated restaurants");
}
main().finally(() => p.$disconnect());

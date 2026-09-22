const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const rs = await p.restaurant.findMany({ where: { name: { contains: 'twilight', mode: 'insensitive' } } });
  console.log(JSON.stringify(rs, null, 2));
}
main().finally(() => p.$disconnect());

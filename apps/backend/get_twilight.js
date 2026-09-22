const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const r = await p.restaurant.findUnique({ where: { slug: 'twilight' }, include: { settings: true } });
  console.log(JSON.stringify(r, null, 2));
}
main().finally(() => p.$disconnect());

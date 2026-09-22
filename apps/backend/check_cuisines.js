const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const r = await p.restaurant.findUnique({ where: { slug: 'twinlight-1249' }, include: { categories: true } });
  console.log(r.categories.map(c => c.name));
}
main().finally(() => p.$disconnect());

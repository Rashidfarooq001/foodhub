const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const rs = await p.category.findMany({ where: { name: { contains: 'North', mode: 'insensitive' } }, include: { restaurant: true } });
  console.log(rs.map(c => c.restaurant.name + " -> " + c.name));
}
main().finally(() => p.$disconnect());

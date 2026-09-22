const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const rs = await p.restaurant.findMany({ select: { name: true, slug: true } });
  console.log(rs);
}
main().finally(() => p.$disconnect());

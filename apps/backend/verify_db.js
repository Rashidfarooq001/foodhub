const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const rs = await p.restaurant.findMany({
    where: { name: { in: ['twinlight', 'pizza hub', 'spice villa'] } },
    select: { name: true, costForTwo: true }
  });
  console.log(rs);
}
main().finally(() => p.$disconnect());

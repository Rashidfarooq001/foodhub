const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const userId = 'b671b6e7-b483-4692-98ba-b76e5c70a888';
  const orders = await p.order.findMany({ where: { customer: { userId } } });
  const undeleted = orders.filter(o => o.deletedAt === null).length;
  console.log(`Total: ${orders.length}, Undeleted: ${undeleted}`);
}
main().finally(() => p.$disconnect());

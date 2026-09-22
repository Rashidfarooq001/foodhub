const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const userId = 'b671b6e7-b483-4692-98ba-b76e5c70a888';
  let whereClause = {
    customer: { userId },
    deletedAt: null,
  };
  const orders = await p.order.findMany({ where: whereClause });
  console.log("Orders count for user:", orders.length);
}
main().finally(() => p.$disconnect());

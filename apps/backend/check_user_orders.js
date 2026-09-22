const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const users = await p.user.findMany({
    include: { customer: { include: { orders: true } } }
  });
  console.log(users.map(u => ({ email: u.email, ordersCount: u.customer?.orders?.length || 0 })));
}
main().finally(() => p.$disconnect());

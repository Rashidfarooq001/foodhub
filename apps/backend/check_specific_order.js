const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const o = await p.order.findUnique({
    where: { id: '889b12a3-01e0-4443-a93b-6f0114a54760' },
    include: { customer: { include: { user: true } } }
  });
  console.log(o ? `Order found! Status: ${o.status}, User ID: ${o.customer?.user?.id}, Email: ${o.customer?.user?.email}` : "Order not found");
}
main().finally(() => p.$disconnect());

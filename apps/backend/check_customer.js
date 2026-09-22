const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const c = await p.customer.findFirst({ where: { orders: { some: {} } }, include: { user: true, orders: true } });
  console.log("Customer with orders:", c.user.id, "has", c.orders.length, "orders");
}
main().finally(() => p.$disconnect());

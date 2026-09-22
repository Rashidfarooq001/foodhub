const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const rest = await p.restaurant.findFirst({ where: { name: { contains: 'twilight', mode: 'insensitive' } } });
  if (!rest) {
    console.log("no twilight");
    return;
  }
  const invoices = await p.settlementInvoice.findMany({ where: { restaurantId: rest.id } });
  console.log("Invoices for twilight:", invoices);
}

main().catch(console.error).finally(() => p.$disconnect());

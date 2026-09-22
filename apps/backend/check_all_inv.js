const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const invoices = await p.settlementInvoice.findMany({ 
    include: { restaurant: { select: { name: true } } }
  });
  console.log("All Invoices:", invoices.map(i => ({ id: i.id, rest: i.restaurant.name, status: i.status })));
}
main().catch(console.error).finally(() => p.$disconnect());

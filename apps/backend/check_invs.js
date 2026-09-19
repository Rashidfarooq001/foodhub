const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const invs = await p.settlementInvoice.findMany();
  console.log('Invoices:', invs.length);
  console.log(invs);
}
main().catch(console.error).finally(() => p.$disconnect());

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const invoices = await p.settlementInvoice.findMany({ where: { restaurantId: '1252fbbb-0ddc-4642-8962-abfd6856625d' } });
  console.log("twinlight invoices:", invoices);
}
main().catch(console.error).finally(() => p.$disconnect());

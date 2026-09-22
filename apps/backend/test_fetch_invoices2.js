const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  try {
    const invoices = await p.settlementInvoice.findMany();
    console.log("Invoices count:", invoices.length);
  } catch (e) {
    console.error("Failed to fetch settlement invoices:", e.message);
  }
}
main().finally(() => p.$disconnect());

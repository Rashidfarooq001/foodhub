const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  try {
    const invoices = await p.settlementInvoice.findMany({ take: 1 });
    console.log("Successfully fetched settlement invoices");
  } catch (e) {
    console.error("Failed to fetch settlement invoices:", e.message);
  }
}
main().finally(() => p.$disconnect());

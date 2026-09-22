const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const t = await p.$queryRawUnsafe(`SHOW CONSTRAINTS FROM settlement_invoices`);
  console.log("Constraints:", t);
}
main().catch(console.error).finally(() => p.$disconnect());

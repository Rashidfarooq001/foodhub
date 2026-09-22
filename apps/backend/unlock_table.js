const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  await p.$executeRawUnsafe(`ALTER TABLE settlement_invoices SET (schema_locked = false);`);
  console.log("Unlocked");
}
main().catch(console.error).finally(() => p.$disconnect());

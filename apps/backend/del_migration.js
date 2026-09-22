const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  await p.$executeRawUnsafe(`DELETE FROM _prisma_migrations WHERE migration_name = '20260919120000_add_settlement_invoice'`);
  console.log("Deleted");
}
main().catch(console.error).finally(() => p.$disconnect());

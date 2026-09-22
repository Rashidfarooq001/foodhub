const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  try {
    const res = await p.$queryRaw`SELECT migration_name, started_at, finished_at, applied_steps_count FROM _prisma_migrations WHERE migration_name = '20260919120000_add_settlement_invoice' ORDER BY started_at DESC`;
    console.table(res);
  } catch (e) {
    console.error(e.message);
  }
}
main().finally(() => p.$disconnect());

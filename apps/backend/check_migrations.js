const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  try {
    const res = await p.$queryRaw`SELECT migration_name, started_at, applied_steps_count FROM _prisma_migrations ORDER BY started_at DESC LIMIT 10`;
    console.table(res);
  } catch (e) {
    console.error(e.message);
  }
}
main().finally(() => p.$disconnect());

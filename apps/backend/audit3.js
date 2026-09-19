const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const migrations = await prisma.$queryRaw`SELECT migration_name, finished_at, rolled_back_at, logs, applied_steps_count FROM _prisma_migrations WHERE migration_name = '20260918210300_final_drift_fix' ORDER BY started_at ASC`;
  console.table(migrations);
}
run();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const migrations = await prisma.$queryRaw`SELECT * FROM _prisma_migrations ORDER BY started_at ASC`;
    console.log('--- MIGRATIONS ---');
    console.table(migrations.map(m => ({
      name: m.migration_name,
      finished: !!m.finished_at,
      rolled_back: !!m.rolled_back_at,
      logs: m.logs ? m.logs.substring(0, 50) : null
    })));

    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'delivery_jobs'
    `;
    console.log('--- DELIVERY_JOBS COLUMNS ---');
    console.table(columns);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();

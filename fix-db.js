const { PrismaClient } = require('./apps/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRaw`DELETE FROM _prisma_migrations WHERE migration_name = '20260912191000_add_pending_driver_id';`;
  console.log('Deleted rows:', result);
}
main().catch(console.error).finally(() => prisma.$disconnect());

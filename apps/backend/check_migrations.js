const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const result = await p.$queryRaw`SELECT migration_name, started_at, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at DESC LIMIT 10`;
  console.log(result);
}
main().catch(console.error).finally(() => p.$disconnect());

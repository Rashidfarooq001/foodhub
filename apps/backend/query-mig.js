const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();
async function run() {
  const result = await prisma.$queryRawUnsafe('SELECT * FROM _prisma_migrations');
  console.log(result.length, 'migrations applied');
  if (result.length > 0) {
    console.log('Last migration:', result[result.length - 1].migration_name);
  }
}
run().catch(console.error).finally(() => process.exit(0));

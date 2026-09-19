const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();
async function run() {
  const result = await prisma.$queryRawUnsafe('SHOW COLUMNS FROM delivery_jobs');
  console.log(result);
}
run().catch(console.error).finally(() => process.exit(0));

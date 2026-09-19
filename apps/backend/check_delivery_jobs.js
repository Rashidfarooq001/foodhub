const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const result = await p.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'delivery_jobs'`;
  console.log('Columns in delivery_jobs:');
  console.log(result.map(r => r.column_name));
}
main().catch(console.error).finally(() => p.$disconnect());

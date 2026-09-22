const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const tables = await p.$queryRawUnsafe(`SHOW TABLES`);
  console.log("Tables:", tables);
}
main().catch(console.error).finally(() => p.$disconnect());

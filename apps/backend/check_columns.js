const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const cols = await p.$queryRaw`SHOW COLUMNS FROM restaurants`;
  console.log(cols.map(c => c.column_name));
}
main().finally(() => p.$disconnect());

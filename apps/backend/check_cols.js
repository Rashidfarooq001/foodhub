const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  try {
    const res = await p.$queryRaw`SHOW COLUMNS FROM delivery_jobs`;
    console.log("Columns:", res.map(c => c.column_name));
  } catch (e) {
    console.error(e);
  }
}
main().finally(() => p.$disconnect());

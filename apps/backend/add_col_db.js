const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  try {
    await p.$executeRawUnsafe(`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS cost_for_two INT4;`);
    console.log("Added column to DB");
  } catch (e) {
    console.error(e);
  }
}
main().finally(() => p.$disconnect());

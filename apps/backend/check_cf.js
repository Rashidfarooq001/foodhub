const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  try {
    const res = await p.$queryRaw`SHOW CHANGEFEEDS`;
    console.log("Changefeeds:", res);
  } catch (e) {
    console.error("Error checking changefeeds", e.message);
  }
}
main().finally(() => p.$disconnect());

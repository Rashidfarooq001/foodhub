const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  try {
    const jobs = await p.deliveryJob.findMany({ take: 1 });
    console.log("Successfully fetched delivery jobs:", jobs);
  } catch (e) {
    console.error("Failed to fetch delivery jobs:", e.message);
  }
}
main().finally(() => p.$disconnect());

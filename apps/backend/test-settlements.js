const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const periodStart = new Date('2000-01-01');
    const periodEnd = new Date('2030-12-31');
    
    const settlements = await prisma.restaurantSettlement.findMany({
      where: { periodStart: { gte: periodStart }, periodEnd: { lte: periodEnd } },
    });
    console.log("Settlements in range:", settlements.length);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();

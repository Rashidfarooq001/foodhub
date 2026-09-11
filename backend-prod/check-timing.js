const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const timings = await prisma.restaurantTiming.findMany({
    take: 10,
    include: { restaurant: { select: { name: true } } }
  });
  console.log(JSON.stringify(timings, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const restaurantId = 'efcc61f1-7314-47a3-888e-aa14c1894c10';

  const timings = [
    { dayOfWeek: 0, openTime: '09:00 AM', closeTime: '11:00 PM', isClosed: false },
    { dayOfWeek: 1, openTime: '09:00 AM', closeTime: '11:00 PM', isClosed: false }
  ];

  await prisma.restaurantTiming.deleteMany({
    where: { restaurantId },
  });

  await prisma.restaurantTiming.createMany({
    data: timings.map((t) => ({
      restaurantId,
      dayOfWeek: t.dayOfWeek,
      openTime: t.openTime,
      closeTime: t.closeTime,
      isClosed: t.isClosed ?? false,
    })),
  });

  const saved = await prisma.restaurantTiming.findMany({ where: { restaurantId } });
  console.log(saved);
}

main().catch(console.error).finally(() => prisma.$disconnect());

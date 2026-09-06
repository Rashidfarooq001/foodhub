const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const restaurant = await prisma.restaurant.findFirst({
    include: { timings: true }
  });
  console.log('Restaurant ID:', restaurant?.id);
  console.log('Timings:', restaurant?.timings);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const count = await prisma.restaurant.count();
  console.log("Restaurants count:", count);
  await prisma.$disconnect();
}
run();

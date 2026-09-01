import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log('Restaurants:', await prisma.restaurant.count());
  console.log('Orders:', await prisma.order.count());
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function checkDups() {
  const foodDups = await prisma.$queryRaw`SELECT order_id, food_item_id, COUNT(*) FROM food_reviews GROUP BY order_id, food_item_id HAVING COUNT(*) > 1`;
  console.log('FoodReview Dups:', foodDups);
}
checkDups().finally(() => prisma.$disconnect());

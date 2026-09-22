const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const r = await p.restaurant.findUnique({
    where: { slug: 'twinlight-1249' },
    include: { foodItems: true }
  });
  if (!r) return console.log("Not found");
  
  const foodItems = r.foodItems;
  console.log(`Food items count: ${foodItems.length}`);
  
  let priceForTwo = undefined;
  if (foodItems.length > 0) {
    const avgPrice = foodItems.reduce((sum, item) => sum + Number(item.price), 0) / foodItems.length;
    priceForTwo = Math.max(100, Math.round((avgPrice * 2) / 50) * 50);
  }
  console.log("Calculated priceForTwo:", priceForTwo);
}
main().finally(() => p.$disconnect());

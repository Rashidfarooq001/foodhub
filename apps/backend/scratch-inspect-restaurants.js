const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const restaurants = await prisma.restaurant.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      deliveryRadius: true,
      status: true,
      foodItems: {
        select: { id: true, name: true, price: true },
      },
    },
  });

  console.log('--- RESTAURANTS IN NEON POSTGRESQL DB ---');
  restaurants.forEach((r, idx) => {
    const avgPrice = r.foodItems.length > 0
      ? r.foodItems.reduce((acc, item) => acc + Number(item.price), 0) / r.foodItems.length
      : 0;
    const estCostForTwo = Math.round((avgPrice * 2) / 50) * 50;

    console.log(`\n[Restaurant ${idx + 1}]`);
    console.log(`Name: "${r.name}"`);
    console.log(`Latitude: ${r.latitude} | Longitude: ${r.longitude}`);
    console.log(`Delivery Radius: ${r.deliveryRadius} km`);
    console.log(`Status: ${r.status}`);
    console.log(`Food Items Count: ${r.foodItems.length}`);
    console.log(`Calculated Avg Price: ₹${avgPrice.toFixed(2)} -> Estimated Cost For Two: ₹${estCostForTwo}`);
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());

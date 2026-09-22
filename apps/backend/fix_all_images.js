const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.foodItem.findMany({
    where: { imageUrl: { contains: 'foodhub-backend-enq2.onrender.com' } }
  });
  console.log(`Found ${items.length} FoodItems to update`);
  
  for (const item of items) {
    if (item.imageUrl) {
      const newImage = item.imageUrl.replace('foodhub-backend-enq2.onrender.com', 'api.zaykafood.online');
      await prisma.foodItem.update({
        where: { id: item.id },
        data: { imageUrl: newImage }
      });
      console.log(`Updated food item ${item.name}`);
    }
  }

  const rests = await prisma.restaurant.findMany({
    where: { 
      OR: [
        { logoUrl: { contains: 'foodhub-backend-enq2.onrender.com' } },
        { bannerUrl: { contains: 'foodhub-backend-enq2.onrender.com' } }
      ]
    }
  });
  console.log(`Found ${rests.length} Restaurants to update`);
  for (const r of rests) {
    let logo = r.logoUrl;
    let banner = r.bannerUrl;
    if (logo) logo = logo.replace('foodhub-backend-enq2.onrender.com', 'api.zaykafood.online');
    if (banner) banner = banner.replace('foodhub-backend-enq2.onrender.com', 'api.zaykafood.online');
    await prisma.restaurant.update({
      where: { id: r.id },
      data: { logoUrl: logo, bannerUrl: banner }
    });
    console.log(`Updated restaurant ${r.name}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());

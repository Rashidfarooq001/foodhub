const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rests = await prisma.restaurant.findMany();
  for (const r of rests) {
    let changed = false;
    let logo = r.logoUrl;
    let banner = r.bannerUrl;
    
    if (logo && logo.includes('foodhub-backend-enq2.onrender.com')) {
      logo = logo.replace('foodhub-backend-enq2.onrender.com', 'api.zaykafood.online');
      changed = true;
    }
    if (banner && banner.includes('foodhub-backend-enq2.onrender.com')) {
      banner = banner.replace('foodhub-backend-enq2.onrender.com', 'api.zaykafood.online');
      changed = true;
    }
    
    if (changed) {
      await prisma.restaurant.update({
        where: { id: r.id },
        data: { logoUrl: logo, bannerUrl: banner }
      });
      console.log(`Updated restaurant ${r.name}`);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());

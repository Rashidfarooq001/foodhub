const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany();
  for (const cat of cats) {
    if (cat.image && cat.image.includes('foodhub-backend-enq2.onrender.com')) {
      const newImage = cat.image.replace('foodhub-backend-enq2.onrender.com', 'api.zaykafood.online');
      await prisma.category.update({
        where: { id: cat.id },
        data: { image: newImage }
      });
      console.log(`Updated category ${cat.name}`);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());

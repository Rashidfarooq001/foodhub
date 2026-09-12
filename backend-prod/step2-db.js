const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const restaurants = await prisma.restaurant.findMany({
    take: 5,
    include: { timings: true }
  });
  
  for (const r of restaurants) {
    console.log(`\n=== RESTAURANT: ${r.name} (ID: ${r.id}) ===`);
    if (r.timings.length === 0) {
      console.log('No timings in DB.');
    } else {
      r.timings.forEach(t => {
        console.log(`Day: ${t.dayOfWeek} | Open: ${t.openTime} | Close: ${t.closeTime} | isClosed: ${t.isClosed}`);
      });
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

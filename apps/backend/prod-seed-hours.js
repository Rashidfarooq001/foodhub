const { PrismaClient } = require('@prisma/client');

// Use environment variables for the database URL so we don't hardcode credentials
const p = new PrismaClient();

const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

async function main() {
  const restaurants = await p.restaurant.findMany({
    where: { status: 'APPROVED', deletedAt: null },
    include: { timings: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${restaurants.length} APPROVED restaurant(s) to seed`);

  for (const restaurant of restaurants) {
    const existingDays = new Set(restaurant.timings.map(t => t.dayOfWeek));
    const missingDays = [0,1,2,3,4,5,6].filter(d => !existingDays.has(d));

    // Use existing non-closed timing as template, else default to 09:00 AM - 11:00 PM
    const ref = restaurant.timings.find(t => !t.isClosed);
    const defaultOpen  = ref ? ref.openTime  : '09:00 AM';
    const defaultClose = ref ? ref.closeTime : '11:00 PM';

    console.log(`\n[${restaurant.name}] id=${restaurant.id}`);
    console.log(`  Existing days: [${[...existingDays].map(d => dayNames[d]).join(', ')}]`);
    console.log(`  Missing  days: [${missingDays.map(d => dayNames[d]).join(', ')}]`);
    console.log(`  Default hours: ${defaultOpen} → ${defaultClose}`);

    if (missingDays.length > 0) {
      await p.restaurantTiming.createMany({
        data: missingDays.map(day => ({
          restaurantId: restaurant.id,
          dayOfWeek:    day,
          openTime:     defaultOpen,
          closeTime:    defaultClose,
          isClosed:     false,
        })),
      });
      console.log(`  ✓ Inserted ${missingDays.length} timing row(s)`);
    } else {
      console.log(`  ✓ All 7 days already present — skipped`);
    }

    if (!restaurant.isOpen) {
      await p.restaurant.update({
        where: { id: restaurant.id },
        data: { isOpen: true },
      });
      console.log(`  ✓ Set isOpen = true`);
    }
  }
}

main()
  .catch(e => { console.error('ERROR:', e.message); process.exit(1); })
  .finally(() => p.$disconnect());

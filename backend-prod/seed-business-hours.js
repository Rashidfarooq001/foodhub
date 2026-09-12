const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Read all restaurants
  const restaurants = await prisma.restaurant.findMany({
    include: { timings: true }
  });

  console.log(`Found ${restaurants.length} restaurant(s)`);

  for (const restaurant of restaurants) {
    const existingDays = new Set(restaurant.timings.map(t => t.dayOfWeek));
    console.log(`\n[${restaurant.name}] id=${restaurant.id}`);
    console.log(`  Existing days: ${[...existingDays].sort().join(', ')}`);

    // If the restaurant already has at least one non-closed timing, use that open/close time as the default
    const referenceDay = restaurant.timings.find(t => !t.isClosed);
    const defaultOpen = referenceDay ? referenceDay.openTime : '09:00 AM';
    const defaultClose = referenceDay ? referenceDay.closeTime : '11:00 PM';
    console.log(`  Default hours: ${defaultOpen} - ${defaultClose}`);

    const allDays = [0, 1, 2, 3, 4, 5, 6]; // 0=Sun .. 6=Sat
    const missingDays = allDays.filter(d => !existingDays.has(d));
    console.log(`  Missing days: ${missingDays.join(', ')}`);

    if (missingDays.length > 0) {
      await prisma.restaurantTiming.createMany({
        data: missingDays.map(day => ({
          restaurantId: restaurant.id,
          dayOfWeek: day,
          openTime: defaultOpen,
          closeTime: defaultClose,
          isClosed: false,
        })),
      });
      console.log(`  ✓ Created ${missingDays.length} missing day(s)`);
    } else {
      console.log(`  ✓ All 7 days already present — no action needed`);
    }
  }

  // Final verification
  console.log('\n--- Final DB state ---');
  const all = await prisma.restaurantTiming.findMany({ orderBy: [{ restaurantId: 'asc' }, { dayOfWeek: 'asc' }] });
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  all.forEach(t => {
    console.log(`  restaurantId=${t.restaurantId} day=${dayNames[t.dayOfWeek]}(${t.dayOfWeek}) ${t.openTime}-${t.closeTime} isClosed=${t.isClosed}`);
  });
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

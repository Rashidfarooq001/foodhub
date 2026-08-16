import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function inspectDriversDatabase() {
  console.log('=== REAL POSTGRESQL DRIVER DATABASE RECORDS INSPECTION ===\n');

  try {
    const drivers = await prisma.driver.findMany({
      include: {
        user: {
          include: { profile: true },
        },
        vehicles: true,
        deliveryJobs: {
          include: { order: true },
        },
        reviews: true,
      },
    });

    console.log(`Total Drivers in DB: ${drivers.length}\n`);

    for (const d of drivers) {
      console.log(`Driver ID: ${d.id}`);
      console.log(`  User ID: ${d.userId}`);
      console.log(`  Email: ${d.user?.email}`);
      console.log(`  Phone: ${d.user?.phone}`);
      console.log(`  User Role: ${d.user?.role}`);
      console.log(`  User Active: ${d.user?.isActive}`);
      console.log(`  Driver Approved: ${d.isApproved}`);
      console.log(`  Driver Status (DB Enum): ${d.status}`);
      console.log(`  DB avgRating: ${d.avgRating}`);
      console.log(`  Current Lat/Lng: ${d.currentLat}, ${d.currentLng}`);
      console.log(`  Vehicles: ${JSON.stringify(d.vehicles)}`);

      const activeJobs = d.deliveryJobs.filter((j: any) =>
        ['ASSIGNED', 'ARRIVED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(j.status)
      );
      const completedJobs = d.deliveryJobs.filter((j: any) => j.status === 'DELIVERED');

      console.log(`  Active Jobs Count: ${activeJobs.length}`);
      console.log(`  Completed Jobs Count: ${completedJobs.length}`);
      console.log(`  Reviews Count: ${d.reviews.length}`);
      console.log('---');
    }
  } catch (err) {
    console.error('Error querying driver database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

inspectDriversDatabase();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    where: {
      profile: {
        firstName: { contains: 'Muneeb', mode: 'insensitive' }
      }
    },
    include: {
      driver: {
        include: {
          vehicles: true,
          deliveryJobs: true
        }
      },
      profile: true
    }
  });
  
  for (const u of users) {
    console.log(`\n================ USER ================`);
    console.log(`User ID: ${u.id}`);
    console.log(`Name: ${u.profile.firstName} ${u.profile.lastName}`);
    console.log(`Role: ${u.role}`);
    console.log(`Phone: ${u.phone}`);
    if (u.driver) {
      console.log(`Driver ID: ${u.driver.id}`);
      console.log(`Vehicle Number: ${u.driver.vehicles[0]?.vehicleNumber}`);
      console.log(`Delivery Jobs Count: ${u.driver.deliveryJobs.length}`);
    } else {
      console.log(`NO DRIVER RECORD`);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());

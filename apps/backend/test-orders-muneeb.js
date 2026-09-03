const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const orderNumbers = ['FH-351823', 'FH-768759', 'FH-609271'];
  
  for (const num of orderNumbers) {
    const order = await prisma.order.findUnique({
      where: { orderNumber: num },
      include: {
        deliveryJob: true,
      }
    });
    
    if (order) {
      console.log(`\n================ ORDER: ${num} ================`);
      console.log(`Order ID: ${order.id}`);
      console.log(`Order Status: ${order.status}`);
      console.log(`Order AssignedRestDriverId: ${order.assignedRestaurantDriverId}`);
      if (order.deliveryJob) {
        console.log(`DeliveryJob ID: ${order.deliveryJob.id}`);
        console.log(`DeliveryJob DriverId: ${order.deliveryJob.driverId}`);
        console.log(`DeliveryJob Status: ${order.deliveryJob.status}`);
      } else {
        console.log(`NO DELIVERY JOB FOUND FOR THIS ORDER!`);
      }
    } else {
      console.log(`\nOrder ${num} not found in DB!`);
    }
  }

  // Find Muneeb
  const driver = await prisma.driver.findFirst({
    where: {
      user: {
        profile: {
          firstName: { contains: 'Muneeb', mode: 'insensitive' }
        }
      }
    },
    include: {
      user: { include: { profile: true } },
      vehicles: true
    }
  });

  if (driver) {
    console.log(`\n================ DRIVER MUNEEB ================`);
    console.log(`Driver ID: ${driver.id}`);
    console.log(`User ID: ${driver.userId}`);
    console.log(`Driver Status: ${driver.status}`);
    console.log(`Driver Approved: ${driver.isApproved}`);
    console.log(`User Active: ${driver.user.isActive}`);
    if (driver.vehicles.length > 0) {
      console.log(`Vehicle Number: ${driver.vehicles[0].vehicleNumber}`);
    }
  } else {
    console.log(`\nDriver Muneeb not found!`);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient, OrderStatus, UserRole } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const muneebId = '9929677c-1a15-4c9a-a7da-0bebfd4b4ac7';
  
  // Create user
  const user = await p.user.create({
    data: {
      email: 'riderb@test.com',
      phone: '+919999999999',
      role: UserRole.DELIVERY_PARTNER,
      passwordHash: 'xx'
    }
  });
  
  // Create driver
  const otherDriver = await p.driver.create({
    data: {
      userId: user.id,
      status: 'ONLINE',
      isApproved: true
    }
  });
  
  console.log("Rider B ID:", otherDriver.id);
  
  // Find valid restaurant and customer
  const orderRef = await p.order.findFirst();
  
  // Create an order
  const order = await p.order.create({
    data: {
      orderNumber: 'FH-ISOLATION-TEST',
      status: OrderStatus.DRIVER_ASSIGNED,
      restaurantId: orderRef.restaurantId,
      customerId: orderRef.customerId,
      deliveryAddressId: orderRef.deliveryAddressId,
      subtotal: 10,
      totalAmount: 10,
      deliveryFee: 0,
      platformFee: 0,
      taxAmount: 0
    }
  });
  
  // Create delivery job for Rider B
  const job = await p.deliveryJob.create({
    data: {
      orderId: order.id,
      driverId: otherDriver.id,
      status: 'ASSIGNED',
      distanceKm: 1,
      estimatedEarnings: 10,
      riderPayout: 10,
      codAmountToCollect: 0
    }
  });
  
  console.log("Created isolated job for Rider B");
  
  // Query for Muneeb
  const muneebJobs = await p.deliveryJob.findMany({
    where: {
      driverId: muneebId,
      order: {
        status: {
          in: ['DRIVER_ASSIGNED', 'ARRIVED_AT_RESTAURANT', 'PICKED_UP', 'OUT_FOR_DELIVERY']
        }
      }
    }
  });
  
  console.log("Muneeb Jobs Count:", muneebJobs.length);
  const foundIsolated = muneebJobs.some(j => j.id === job.id);
  console.log("Muneeb sees Rider B's job?", foundIsolated);
}
run().catch(e => console.error(e.message)).finally(() => p.$disconnect());

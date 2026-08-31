const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const driver = await prisma.driver.findFirst({
    include: {
      user: true,
      deliveryJobs: true
    }
  });
  console.log("DRIVER ID:", driver.id, "USER ID:", driver.user.id);
  console.log("JOBS COUNT:", driver.deliveryJobs.length);
  
  const ordersByDriverId = await prisma.order.findMany({
    where: { driverId: driver.id }
  });
  console.log("ORDERS BY driverId:", ordersByDriverId.length);

  const ordersByFoodHubId = await prisma.order.findMany({
    where: { assignedFoodHubDriverId: driver.id }
  });
  console.log("ORDERS BY assignedFoodHubDriverId:", ordersByFoodHubId.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());

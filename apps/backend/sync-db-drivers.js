require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://xata:NVMQa777Q7BsJsXq7fRrzNHSR2Uw7QFnRP28BgcEdxqBPOKPwGATUJWh2ivZiMgi@m4j4guhju95knfng9pm4f0dthc.us-east-1.xata.tech/xata?sslmode=require"
    }
  }
});

async function run() {
  // Sync any orders that have a deliveryJob with driverId but Order.assignedFoodHubDriverId is null
  const jobsWithDriver = await prisma.deliveryJob.findMany({
    where: {
      driverId: { not: null },
      order: { assignedFoodHubDriverId: null }
    },
    select: { id: true, orderId: true, driverId: true }
  });

  console.log("Inconsistent jobs found:", jobsWithDriver.length);
  for (const job of jobsWithDriver) {
    if (job.driverId) {
      await prisma.order.update({
        where: { id: job.orderId },
        data: { assignedFoodHubDriverId: job.driverId }
      });
      console.log(`Synced order ${job.orderId} -> driver ${job.driverId}`);
    }
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());

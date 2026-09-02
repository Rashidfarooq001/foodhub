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
  const jobs = await prisma.deliveryJob.findMany({
    where: { driverId: "bfb6574a-eb3f-4e02-b5c1-e09b28b776a5" },
    include: { order: { select: { id: true, orderNumber: true, status: true, createdAt: true } } },
    orderBy: { createdAt: "desc" }
  });
  console.log("ALL DeliveryJobs for driver bfb6574a (count: " + jobs.length + "):");
  jobs.forEach(j => {
    console.log(`Job ID: ${j.id} | Job createdAt: ${j.createdAt.toISOString()} | Order: ${j.order?.orderNumber} | Order status: ${j.order?.status} | Order createdAt: ${j.order?.createdAt?.toISOString()}`);
  });
}
run().catch(console.error).finally(() => prisma.$disconnect());

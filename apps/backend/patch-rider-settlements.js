const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const jobs = await prisma.deliveryJob.findMany({
    include: { order: true }
  });

  for (const job of jobs) {
    if (job.order && job.order.pricingSnapshot) {
      const snap = job.order.pricingSnapshot;
      if (snap.riderPayout != null) {
        await prisma.deliveryJob.update({
          where: { id: job.id },
          data: { riderPayout: snap.riderPayout }
        });
        await prisma.riderSettlement.updateMany({
          where: { orderId: job.orderId },
          data: { 
            netPayable: snap.riderPayout,
            basePayoutAmount: snap.riderBasePayout != null ? snap.riderBasePayout : snap.riderPayout
          }
        });
        console.log(`Patched order ${job.orderId} riderPayout to ${snap.riderPayout}`);
      }
    }
  }
  await prisma.$disconnect();
}
run();

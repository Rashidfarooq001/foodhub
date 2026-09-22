const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  try {
    const orders = await p.order.findMany({
      include: {
        deliveryJob: true,
      },
      take: 1
    });
    console.log("Successfully fetched orders with delivery job:", orders.length);
  } catch (e) {
    console.error("Failed to fetch orders:", e.message);
  }
}
main().finally(() => p.$disconnect());

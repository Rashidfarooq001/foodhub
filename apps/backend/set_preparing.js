const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const order = await p.order.findFirst();
  if (!order) return;
  await p.order.update({
    where: { id: order.id },
    data: { status: 'PREPARING' }
  });
  console.log("Updated to PREPARING:", order.id);
}
main().catch(console.error).finally(() => p.$disconnect());

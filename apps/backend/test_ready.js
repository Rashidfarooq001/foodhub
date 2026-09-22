const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const ready = await p.order.findMany({
    where: { status: 'READY_FOR_PICKUP' },
    include: { restaurant: true }
  });
  console.log(JSON.stringify(ready, null, 2));
}
main().catch(console.error).finally(() => p.$disconnect());

const http = require('http');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const order = await p.order.findFirst({
    where: { status: 'PREPARING' }
  });
  if (!order) {
    console.log("No preparing orders.");
    return;
  }
  
  console.log("Found order:", order.id, order.status);
}

main().catch(console.error).finally(() => p.$disconnect());

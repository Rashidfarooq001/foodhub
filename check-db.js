const { PrismaClient } = require('./apps/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'delivery_jobs' AND column_name IN ('pending_driver_id', 'offer_expires_at');`;
  console.log('Columns:', result);
}
main().catch(console.error).finally(() => prisma.$disconnect());

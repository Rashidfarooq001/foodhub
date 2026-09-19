const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`ALTER TABLE "delivery_jobs" ADD COLUMN IF NOT EXISTS "pending_driver_id" UUID;`;
  await prisma.$executeRaw`ALTER TABLE "delivery_jobs" ADD CONSTRAINT "delivery_jobs_pending_driver_id_fkey" FOREIGN KEY ("pending_driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;`;
  await prisma.$executeRaw`ALTER TABLE "delivery_jobs" ADD COLUMN IF NOT EXISTS "offer_expires_at" TIMESTAMP(3);`;
  console.log("Columns added successfully");
}
main().catch(console.error).finally(() => prisma.$disconnect());

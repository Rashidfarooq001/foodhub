const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  try {
    await p.$executeRawUnsafe(`ALTER TABLE delivery_jobs ADD COLUMN IF NOT EXISTS pending_driver_id UUID;`);
    console.log("Added pending_driver_id");
  } catch (e) {
    console.error("Failed to add pending_driver_id:", e.message);
  }
  
  try {
    await p.$executeRawUnsafe(`ALTER TABLE delivery_jobs ADD COLUMN IF NOT EXISTS offer_expires_at TIMESTAMP;`);
    console.log("Added offer_expires_at");
  } catch (e) {
    console.error("Failed to add offer_expires_at:", e.message);
  }
}
main().finally(() => p.$disconnect());

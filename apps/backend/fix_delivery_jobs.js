const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  console.log('Adding missing columns to delivery_jobs...');
  await p.$executeRawUnsafe(`ALTER TABLE delivery_jobs ADD COLUMN IF NOT EXISTS pending_driver_id UUID`);
  await p.$executeRawUnsafe(`ALTER TABLE delivery_jobs ADD COLUMN IF NOT EXISTS offer_expires_at TIMESTAMP`);
  
  // Also add foreign key if missing
  try {
    await p.$executeRawUnsafe(`ALTER TABLE delivery_jobs ADD CONSTRAINT fk_pending_driver FOREIGN KEY (pending_driver_id) REFERENCES users(id) ON DELETE SET NULL`);
    console.log('Added foreign key for pending_driver_id');
  } catch (e) {
    console.log('FK might already exist or error:', e.message);
  }

  const result = await p.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'delivery_jobs'`;
  console.log('Columns in delivery_jobs now:');
  console.log(result.map(r => r.column_name));
}
main().catch(console.error).finally(() => p.$disconnect());

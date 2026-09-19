const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  // Unlock table, add FK and indexes if needed
  await p.$executeRaw`ALTER TABLE settlement_invoices SET (schema_locked = false)`;
  // Check if FK already exists
  const result = await p.$queryRaw`
    SELECT constraint_name FROM information_schema.table_constraints
    WHERE table_name = 'settlement_invoices' AND constraint_name = 'settlement_invoices_restaurant_id_fkey'
  `;
  if (result.length === 0) {
    await p.$executeRaw`ALTER TABLE "settlement_invoices" ADD CONSTRAINT "settlement_invoices_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
  }
  // Check invoice_number index  
  const idx1 = await p.$queryRaw`SELECT index_name FROM information_schema.statistics WHERE table_name = 'settlement_invoices' AND index_name = 'settlement_invoices_invoice_number_key'`;
  if (idx1.length === 0) {
    await p.$executeRaw`CREATE UNIQUE INDEX "settlement_invoices_invoice_number_key" ON "settlement_invoices"("invoice_number")`;
  }
  // Check unique period index
  const idx2 = await p.$queryRaw`SELECT index_name FROM information_schema.statistics WHERE table_name = 'settlement_invoices' AND index_name = 'settlement_invoice_unique'`;
  if (idx2.length === 0) {
    await p.$executeRaw`CREATE UNIQUE INDEX "settlement_invoice_unique" ON "settlement_invoices"("restaurant_id", "period_start", "period_end")`;
  }
  // Check restaurant_id index
  const idx3 = await p.$queryRaw`SELECT index_name FROM information_schema.statistics WHERE table_name = 'settlement_invoices' AND index_name = 'settlement_invoices_restaurant_id_idx'`;
  if (idx3.length === 0) {
    await p.$executeRaw`CREATE INDEX "settlement_invoices_restaurant_id_idx" ON "settlement_invoices"("restaurant_id")`;
  }
  console.log('settlement_invoices table fully configured');
}
main().catch(e => {
  console.error('ERROR:', e.message);
}).finally(() => p.$disconnect());

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  await p.$executeRawUnsafe(`ALTER TABLE settlement_invoices SET (schema_locked = false);`);
  try { await p.$executeRawUnsafe(`CREATE UNIQUE INDEX "settlement_invoices_invoice_number_key" ON "settlement_invoices"("invoice_number");`); console.log("IDX 1 OK") } catch(e){console.error(e.message)}
  try { await p.$executeRawUnsafe(`CREATE UNIQUE INDEX "settlement_invoice_unique" ON "settlement_invoices"("restaurant_id", "period_start", "period_end");`); console.log("IDX 2 OK") } catch(e){console.error(e.message)}
  try { await p.$executeRawUnsafe(`CREATE INDEX "settlement_invoices_restaurant_id_idx" ON "settlement_invoices"("restaurant_id");`); console.log("IDX 3 OK") } catch(e){console.error(e.message)}
  try { await p.$executeRawUnsafe(`ALTER TABLE "settlement_invoices" ADD CONSTRAINT "settlement_invoices_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;`); console.log("FK OK") } catch(e){console.error(e.message)}
}
main().catch(console.error).finally(() => p.$disconnect());

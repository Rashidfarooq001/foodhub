const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  try {
    await p.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "settlement_invoices" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "invoice_number" STRING NOT NULL,
          "restaurant_id" UUID NOT NULL,
          "period_start" TIMESTAMP(3) NOT NULL,
          "period_end" TIMESTAMP(3) NOT NULL,
          "gross_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          "commission_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          "commission_gst" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          "commission_total" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          "net_payable" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          "pending_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          "payment_method" STRING NOT NULL DEFAULT 'MANUAL',
          "payment_date" TIMESTAMP(3) NOT NULL,
          "admin_id" UUID,
          "notes" STRING,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "settlement_invoices_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log("Created table");
    
    await p.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "settlement_invoices_invoice_number_key" ON "settlement_invoices"("invoice_number");`);
    await p.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "settlement_invoice_unique" ON "settlement_invoices"("restaurant_id", "period_start", "period_end");`);
    await p.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "settlement_invoices_restaurant_id_idx" ON "settlement_invoices"("restaurant_id");`);
    
    try {
      await p.$executeRawUnsafe(`ALTER TABLE "settlement_invoices" ADD CONSTRAINT "settlement_invoices_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;`);
      console.log("Added foreign key");
    } catch(e) { console.log("FK already exists or error", e.message); }
    
  } catch (e) {
    console.error("Failed to create settlement_invoices:", e.message);
  }
}
main().finally(() => p.$disconnect());

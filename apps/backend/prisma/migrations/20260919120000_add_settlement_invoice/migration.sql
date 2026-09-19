-- CreateTable: settlement_invoices
CREATE TABLE "settlement_invoices" (
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
CREATE UNIQUE INDEX "settlement_invoices_invoice_number_key" ON "settlement_invoices"("invoice_number");
CREATE UNIQUE INDEX "settlement_invoice_unique" ON "settlement_invoices"("restaurant_id", "period_start", "period_end");
CREATE INDEX "settlement_invoices_restaurant_id_idx" ON "settlement_invoices"("restaurant_id");
ALTER TABLE "settlement_invoices" ADD CONSTRAINT "settlement_invoices_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
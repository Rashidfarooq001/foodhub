-- Upgrade Settlement model for weekly period tracking, financial precision, and bank payout lifecycle
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SettlementStatus') THEN
        CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'PROCESSING', 'SETTLED', 'PAYOUT_FAILED');
    END IF;
END $$;

-- Alter settlements table to add missing weekly period and payout columns
ALTER TABLE "settlements" 
    ADD COLUMN IF NOT EXISTS "period_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "period_end" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "order_count" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "gross_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS "commission_rate" DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS "commission_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS "deductions" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS "net_payable" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS "pending_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS "payout_id" TEXT,
    ADD COLUMN IF NOT EXISTS "failure_reason" TEXT,
    ADD COLUMN IF NOT EXISTS "initiated_at" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "admin_id" UUID,
    ADD COLUMN IF NOT EXISTS "notes" TEXT,
    ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Drop obsolete or conflicting single UTR unique index if present and create composite unique constraint
DO $$
BEGIN
    ALTER TABLE "settlements" DROP CONSTRAINT IF EXISTS "settlements_utr_number_key";
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Add foreign key reference to restaurants table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'settlements_restaurant_id_fkey'
    ) THEN
        ALTER TABLE "settlements" ADD CONSTRAINT "settlements_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Add unique constraint on restaurant_id + period_start + period_end
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'settlements_restaurant_id_period_start_period_end_key'
    ) THEN
        ALTER TABLE "settlements" ADD CONSTRAINT "settlements_restaurant_id_period_start_period_end_key" UNIQUE ("restaurant_id", "period_start", "period_end");
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "settlements_restaurant_id_idx" ON "settlements"("restaurant_id");
CREATE INDEX IF NOT EXISTS "settlements_status_idx" ON "settlements"("status");
CREATE INDEX IF NOT EXISTS "settlements_period_start_period_end_idx" ON "settlements"("period_start", "period_end");

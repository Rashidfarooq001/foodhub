-- AlterTable
ALTER TABLE "delivery_jobs" ADD COLUMN IF NOT EXISTS "offer_expires_at" TIMESTAMP(3);

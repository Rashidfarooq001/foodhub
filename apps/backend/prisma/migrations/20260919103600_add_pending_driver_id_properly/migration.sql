-- AlterTable
ALTER TABLE "delivery_jobs" ADD COLUMN IF NOT EXISTS "pending_driver_id" UUID;

-- AddForeignKey
ALTER TABLE "delivery_jobs" ADD CONSTRAINT "delivery_jobs_pending_driver_id_fkey" FOREIGN KEY ("pending_driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "delivery_jobs" ADD COLUMN IF NOT EXISTS "offer_expires_at" TIMESTAMP(3);
ALTER TABLE "delivery_jobs" ADD COLUMN IF NOT EXISTS "pending_driver_id" UUID;

-- AlterTable
ALTER TABLE "otps" ADD COLUMN IF NOT EXISTS "attempts" INT4 NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "coupon_usages_order_id_key" ON "coupon_usages"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "coupon_usages_coupon_id_customer_id_key" ON "coupon_usages"("coupon_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "food_reviews_order_id_food_item_id_key" ON "food_reviews"("order_id", "food_item_id");

-- AddForeignKey
ALTER TABLE "delivery_jobs" ADD CONSTRAINT "delivery_jobs_pending_driver_id_fkey" FOREIGN KEY ("pending_driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Re-add admin columns just in case a fresh database dropped them in 20260909_admin_mfa
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password1_hash" STRING;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password2_hash" STRING;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "admin_dob_hash" STRING;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "admin_favorite_person_hash" STRING;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "admin_recovery_token" STRING;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "admin_recovery_expires_at" TIMESTAMP(3);


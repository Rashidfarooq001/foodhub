-- CreateEnum: DeliveryMode
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeliveryMode') THEN
        CREATE TYPE "DeliveryMode" AS ENUM ('FOODHUB_DELIVERY', 'RESTAURANT_SELF_DELIVERY');
    END IF;
END $$;

-- CreateEnum: RestaurantDriverStatus
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RestaurantDriverStatus') THEN
        CREATE TYPE "RestaurantDriverStatus" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE');
    END IF;
END $$;

-- AlterTable: Add delivery_mode to restaurants
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'delivery_mode') THEN
        ALTER TABLE "restaurants" ADD COLUMN "delivery_mode" "DeliveryMode" NOT NULL DEFAULT 'FOODHUB_DELIVERY';
    END IF;
END $$;

-- AlterTable: Add assigned driver columns to orders
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'assigned_foodhub_driver_id') THEN
        ALTER TABLE "orders" ADD COLUMN "assigned_foodhub_driver_id" UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'assigned_restaurant_driver_id') THEN
        ALTER TABLE "orders" ADD COLUMN "assigned_restaurant_driver_id" UUID;
    END IF;
END $$;

-- CreateTable: restaurant_delivery_staff
CREATE TABLE IF NOT EXISTS "restaurant_delivery_staff" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "avatar" TEXT,
    "vehicle_type" TEXT,
    "vehicle_number" TEXT,
    "status" "RestaurantDriverStatus" NOT NULL DEFAULT 'AVAILABLE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_delivery_staff_pkey" PRIMARY KEY ("id")
);

-- AddForeignKeys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'restaurant_delivery_staff_restaurant_id_fkey') THEN
        ALTER TABLE "restaurant_delivery_staff" ADD CONSTRAINT "restaurant_delivery_staff_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'orders_assigned_restaurant_driver_id_fkey') THEN
        ALTER TABLE "orders" ADD CONSTRAINT "orders_assigned_restaurant_driver_id_fkey" FOREIGN KEY ("assigned_restaurant_driver_id") REFERENCES "restaurant_delivery_staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

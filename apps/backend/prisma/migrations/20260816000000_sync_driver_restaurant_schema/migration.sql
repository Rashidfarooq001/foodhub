-- Migration: 20260816000000_sync_driver_restaurant_schema
-- Synchronize Driver, Restaurant, and Admin Recovery columns with schema.prisma

-- CreateEnum: DriverStatus
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DriverStatus') THEN
        CREATE TYPE "DriverStatus" AS ENUM ('OFFLINE', 'ONLINE', 'BUSY', 'SUSPENDED');
    END IF;
END $$;

-- CreateEnum: VehicleType
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VehicleType') THEN
        CREATE TYPE "VehicleType" AS ENUM ('BICYCLE', 'SCOOTER', 'MOTORCYCLE', 'EV_SCOOTER');
    END IF;
END $$;

-- AlterTable: users (admin recovery columns)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'admin_dob_hash') THEN
        ALTER TABLE "users" ADD COLUMN "admin_dob_hash" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'admin_favorite_person_hash') THEN
        ALTER TABLE "users" ADD COLUMN "admin_favorite_person_hash" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'admin_recovery_token') THEN
        ALTER TABLE "users" ADD COLUMN "admin_recovery_token" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'admin_recovery_expires_at') THEN
        ALTER TABLE "users" ADD COLUMN "admin_recovery_expires_at" TIMESTAMP(3);
    END IF;
END $$;

-- AlterTable: drivers (presence and location columns)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'online_since') THEN
        ALTER TABLE "drivers" ADD COLUMN "online_since" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'last_seen_at') THEN
        ALTER TABLE "drivers" ADD COLUMN "last_seen_at" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'current_lat') THEN
        ALTER TABLE "drivers" ADD COLUMN "current_lat" DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'current_lng') THEN
        ALTER TABLE "drivers" ADD COLUMN "current_lng" DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'avg_rating') THEN
        ALTER TABLE "drivers" ADD COLUMN "avg_rating" DECIMAL(3,2) NOT NULL DEFAULT 0.0;
    END IF;
END $$;

-- AlterTable: restaurants (safe coordinate nullability)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'latitude' AND is_nullable = 'NO') THEN
        ALTER TABLE "restaurants" ALTER COLUMN "latitude" DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'longitude' AND is_nullable = 'NO') THEN
        ALTER TABLE "restaurants" ALTER COLUMN "longitude" DROP NOT NULL;
    END IF;
END $$;

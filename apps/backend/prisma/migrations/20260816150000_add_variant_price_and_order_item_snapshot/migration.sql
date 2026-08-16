-- Migration: 20260816150000_add_variant_price_and_order_item_snapshot
-- Adds price, is_available, display_order, timestamps to food_variants
-- Adds variant_id, variant_name, item_snapshot to order_items

-- AlterTable: food_variants
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_variants' AND column_name = 'price') THEN
        ALTER TABLE "food_variants" ADD COLUMN "price" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_variants' AND column_name = 'price_modifier' AND is_nullable = 'NO') THEN
        ALTER TABLE "food_variants" ALTER COLUMN "price_modifier" DROP NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_variants' AND column_name = 'is_available') THEN
        ALTER TABLE "food_variants" ADD COLUMN "is_available" BOOLEAN NOT NULL DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_variants' AND column_name = 'display_order') THEN
        ALTER TABLE "food_variants" ADD COLUMN "display_order" INTEGER NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_variants' AND column_name = 'created_at') THEN
        ALTER TABLE "food_variants" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_variants' AND column_name = 'updated_at') THEN
        ALTER TABLE "food_variants" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- AlterTable: order_items
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'variant_id') THEN
        ALTER TABLE "order_items" ADD COLUMN "variant_id" UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'variant_name') THEN
        ALTER TABLE "order_items" ADD COLUMN "variant_name" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'item_snapshot') THEN
        ALTER TABLE "order_items" ADD COLUMN "item_snapshot" JSONB;
    END IF;
END $$;

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    let dbUrl = process.env.DATABASE_URL;

    if (!dbUrl || dbUrl.trim() === '') {
      throw new Error(
        'CRITICAL CONFIGURATION ERROR: DATABASE_URL environment variable is missing. ' +
        'Specify a valid DATABASE_URL in environment configuration.',
      );
    }

    // Ensure connection timeout is generous for serverless databases (Neon / Supabase)
    if (dbUrl.includes('neon.tech') && !dbUrl.includes('connect_timeout=')) {
      const separator = dbUrl.includes('?') ? '&' : '?';
      dbUrl = `${dbUrl}${separator}connect_timeout=30&pool_timeout=30`;
    }

    super({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    const maxRetries = 10;
    const retryDelayMs = 3000;
    let connected = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Connecting to database (attempt ${attempt}/${maxRetries})...`);
        await this.$connect();
        connected = true;
        this.logger.log('Database connection initialized successfully.');
        break;
      } catch (err: any) {
        this.logger.warn(
          `Database connection attempt ${attempt}/${maxRetries} failed: ${err?.message || err}. ` +
          `Retrying in ${retryDelayMs / 1000}s (serverless DB may be waking up)...`,
        );

        if (attempt === maxRetries) {
          this.logger.error(
            'CRITICAL: Unable to reach PostgreSQL database after multiple retries. ' +
            'Please verify in your Neon Console (https://console.neon.tech) that your project is active and copy the latest DATABASE_URL into Render Environment Variables.',
          );
          throw err;
        }

        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }

    if (!connected) return;

    // Safely ensure new schema columns exist in production PostgreSQL
    try {
        await this.$executeRawUnsafe(`
          DO $$
          BEGIN
            -- Ensure all food_variants columns exist
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'food_variants') THEN
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'food_variants' AND column_name = 'price'
              ) THEN
                ALTER TABLE "food_variants" ADD COLUMN "price" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'food_variants' AND column_name = 'is_available'
              ) THEN
                ALTER TABLE "food_variants" ADD COLUMN "is_available" BOOLEAN NOT NULL DEFAULT true;
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'food_variants' AND column_name = 'display_order'
              ) THEN
                ALTER TABLE "food_variants" ADD COLUMN "display_order" INTEGER NOT NULL DEFAULT 0;
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'food_variants' AND column_name = 'price_modifier'
              ) THEN
                ALTER TABLE "food_variants" ADD COLUMN "price_modifier" DECIMAL(10,2);
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'food_variants' AND column_name = 'created_at'
              ) THEN
                ALTER TABLE "food_variants" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'food_variants' AND column_name = 'updated_at'
              ) THEN
                ALTER TABLE "food_variants" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
              END IF;
            END IF;

            -- Ensure categories columns exist
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'categories' AND column_name = 'display_order'
              ) THEN
                ALTER TABLE "categories" ADD COLUMN "display_order" INTEGER NOT NULL DEFAULT 0;
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'categories' AND column_name = 'is_active'
              ) THEN
                ALTER TABLE "categories" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'categories' AND column_name = 'created_at'
              ) THEN
                ALTER TABLE "categories" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'categories' AND column_name = 'updated_at'
              ) THEN
                ALTER TABLE "categories" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
              END IF;
            END IF;

            -- Ensure food_items columns exist
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'food_items') THEN
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'food_items' AND column_name = 'deleted_at'
              ) THEN
                ALTER TABLE "food_items" ADD COLUMN "deleted_at" TIMESTAMP(3);
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'food_items' AND column_name = 'is_available'
              ) THEN
                ALTER TABLE "food_items" ADD COLUMN "is_available" BOOLEAN NOT NULL DEFAULT true;
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'food_items' AND column_name = 'is_veg'
              ) THEN
                ALTER TABLE "food_items" ADD COLUMN "is_veg" BOOLEAN NOT NULL DEFAULT true;
              END IF;
            END IF;

            -- Ensure order_items variant & snapshot columns exist
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'order_items' AND column_name = 'variant_id'
              ) THEN
                ALTER TABLE "order_items" ADD COLUMN "variant_id" UUID;
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'order_items' AND column_name = 'variant_name'
              ) THEN
                ALTER TABLE "order_items" ADD COLUMN "variant_name" TEXT;
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'order_items' AND column_name = 'unit_price'
              ) THEN
                ALTER TABLE "order_items" ADD COLUMN "unit_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'order_items' AND column_name = 'item_snapshot'
              ) THEN
                ALTER TABLE "order_items" ADD COLUMN "item_snapshot" JSONB;
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'order_items' AND column_name = 'addons_json'
              ) THEN
                ALTER TABLE "order_items" ADD COLUMN "addons_json" JSONB;
              END IF;
            END IF;

            -- Ensure settlements table has all weekly settlement columns
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settlements') THEN
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'settlements' AND column_name = 'period_start'
              ) THEN
                ALTER TABLE "settlements" ADD COLUMN "period_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'settlements' AND column_name = 'period_end'
              ) THEN
                ALTER TABLE "settlements" ADD COLUMN "period_end" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'settlements' AND column_name = 'gross_amount'
              ) THEN
                ALTER TABLE "settlements" ADD COLUMN "gross_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'settlements' AND column_name = 'commission_amount'
              ) THEN
                ALTER TABLE "settlements" ADD COLUMN "commission_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'settlements' AND column_name = 'net_payable'
              ) THEN
                ALTER TABLE "settlements" ADD COLUMN "net_payable" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'settlements' AND column_name = 'paid_amount'
              ) THEN
                ALTER TABLE "settlements" ADD COLUMN "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'settlements' AND column_name = 'pending_amount'
              ) THEN
                ALTER TABLE "settlements" ADD COLUMN "pending_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'settlements' AND column_name = 'order_count'
              ) THEN
                ALTER TABLE "settlements" ADD COLUMN "order_count" INTEGER NOT NULL DEFAULT 0;
              END IF;

              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'settlements' AND column_name = 'deductions'
              ) THEN
                ALTER TABLE "settlements" ADD COLUMN "deductions" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
              END IF;
            END IF;
          END $$;
        `);
        this.logger.log('Database schema self-heal check completed.');
      } catch (migrationErr: any) {
        this.logger.warn(`Schema self-heal warning: ${migrationErr?.message || migrationErr}`);
      }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

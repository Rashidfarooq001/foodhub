import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl || dbUrl.trim() === '') {
      throw new Error(
        'CRITICAL CONFIGURATION ERROR: DATABASE_URL environment variable is missing. ' +
        'Specify a valid DATABASE_URL in environment configuration.',
      );
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
    try {
      await this.$connect();
      this.logger.log('Database connection initialized successfully.');

      // Safely ensure new schema columns exist in production PostgreSQL
      try {
        await this.$executeRawUnsafe(`
          DO $$
          BEGIN
            -- Ensure food_variants.price column exists
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'food_variants' AND column_name = 'price'
            ) THEN
              ALTER TABLE "food_variants" ADD COLUMN "price" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
            END IF;

            -- Ensure order_items variant & snapshot columns exist
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
    } catch (err: any) {
      this.logger.error(`Database connection init failed: ${err?.message || err}`);
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

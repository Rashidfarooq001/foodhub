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
      await this.syncMissingColumns();
    } catch (err: any) {
      this.logger.error(`Database connection init failed: ${err?.message || err}`);
      throw err;
    }
  }

  private async syncMissingColumns() {
    const ddlStatements = [
      `ALTER TABLE delivery_jobs ADD COLUMN IF NOT EXISTS pickup_otp_hash VARCHAR(255);`,
      `ALTER TABLE delivery_jobs ADD COLUMN IF NOT EXISTS pickup_otp_expires_at TIMESTAMP WITH TIME ZONE;`,
      `ALTER TABLE delivery_jobs ADD COLUMN IF NOT EXISTS pickup_otp_attempts INT DEFAULT 0;`,
      `ALTER TABLE delivery_jobs ADD COLUMN IF NOT EXISTS pickup_verified_at TIMESTAMP WITH TIME ZONE;`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_otp_hash VARCHAR(255);`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_otp_expires_at TIMESTAMP WITH TIME ZONE;`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_otp_attempts INT DEFAULT 0;`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_otp_verified_at TIMESTAMP WITH TIME ZONE;`,
    ];

    for (const sql of ddlStatements) {
      try {
        await this.$executeRawUnsafe(sql);
      } catch (err: any) {
        this.logger.warn(`Schema column sync warning for "${sql}": ${err?.message}`);
      }
    }
    this.logger.log('Prisma schema missing columns synchronized successfully on target PostgreSQL.');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

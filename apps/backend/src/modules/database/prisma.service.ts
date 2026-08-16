import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

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

      // Check if critical schema tables exist in the target database
      await this.ensureSchemaSynchronized();
    } catch (err: any) {
      this.logger.error(`Database connection or schema init failed: ${err?.message || err}`);
      throw err;
    }
  }

  private async ensureSchemaSynchronized() {
    try {
      // Query information_schema to verify existence of public.delivery_jobs
      const result: any[] = await this.$queryRawUnsafe(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'delivery_jobs';
      `);

      if (!result || result.length === 0) {
        this.logger.warn('Table public.delivery_jobs missing in target database. Synchronizing schema via prisma db push...');
        try {
          execSync('npx prisma db push --accept-data-loss', {
            stdio: 'inherit',
            env: process.env,
          });
          this.logger.log('Schema synchronized successfully with PostgreSQL.');
        } catch (pushErr: any) {
          this.logger.error(`Prisma db push execution failed: ${pushErr?.message || pushErr}`);
        }
      }
    } catch (checkErr: any) {
      this.logger.warn(`Schema existence check skipped or failed: ${checkErr?.message || checkErr}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

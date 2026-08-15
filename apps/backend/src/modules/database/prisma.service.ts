import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const FALLBACK_LIVE_DB_URL =
  'postgresql://foodhub_db_owner:npg_u6Q1yYwzXbFK@ep-super-pond-a10g8w9v-pooler.ap-southeast-1.aws.neon.tech/foodhub_db?sslmode=require';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const envUrl = process.env.DATABASE_URL;
    const dbUrl =
      envUrl && !envUrl.includes('ep-empty-block-ayeiv0ux')
        ? envUrl
        : FALLBACK_LIVE_DB_URL;

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
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

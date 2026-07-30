import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '../cache/cache.service';

@ApiTags('Health & Monitoring (Phase 18)')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'System Uptime & Basic Health' })
  check() {
    const memory = process.memoryUsage();
    return {
      status: 'ok',
      service: 'FoodHub Backend Core API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
        heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
      },
    };
  }

  @Get('db')
  @ApiOperation({ summary: 'Database Health (Prisma PostgreSQL)' })
  async checkDb() {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        latencyMs: Date.now() - start,
        component: 'PostgreSQL Database',
      };
    } catch (err) {
      throw new ServiceUnavailableException({
        status: 'error',
        component: 'PostgreSQL Database',
        message: err instanceof Error ? err.message : 'Database ping failed',
      });
    }
  }

  @Get('redis')
  @ApiOperation({ summary: 'Cache Health (Redis)' })
  async checkRedis() {
    try {
      const start = Date.now();
      await this.cache.set('health_ping', 'ok', 10);
      const val = await this.cache.get<string>('health_ping');
      if (val !== 'ok') throw new Error('Cache read mismatch');

      return {
        status: 'ok',
        latencyMs: Date.now() - start,
        component: 'Redis Cache',
      };
    } catch (err) {
      throw new ServiceUnavailableException({
        status: 'error',
        component: 'Redis Cache',
        message: err instanceof Error ? err.message : 'Redis ping failed',
      });
    }
  }

  @Get('ready')
  @ApiOperation({ summary: 'Comprehensive Readiness Probe (Kubernetes / Infrastructure)' })
  async checkReady() {
    const dbStatus = await this.checkDb().catch((e) => ({ status: 'error', error: e.message }));
    const redisStatus = await this.checkRedis().catch((e) => ({ status: 'error', error: e.message }));

    const isHealthy = dbStatus.status === 'ok' && redisStatus.status === 'ok';

    if (!isHealthy) {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        db: dbStatus,
        redis: redisStatus,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      status: 'ready',
      db: dbStatus,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    };
  }
}

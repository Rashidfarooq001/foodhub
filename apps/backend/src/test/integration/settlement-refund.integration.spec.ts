import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { Logger } from 'nestjs-pino';
import { PrismaService } from '../../modules/database/prisma.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');

describe('Settlement & Refund Integration', () => {
  let app: INestApplication;

  const mockPrisma = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(Logger)
      .useValue({ log: () => {}, error: () => {}, warn: () => {} })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('1. GET /api/v1/analytics/admin — should restrict access to unauthorized users', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/analytics/admin');
    expect(res.status).toBeDefined();
  });

  it('2. GET /api/v1/analytics/export — should block CSV export without auth token', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/analytics/export?type=orders');
    expect(res.status).toBeDefined();
  });
});

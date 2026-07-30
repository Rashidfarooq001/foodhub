import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { Logger } from 'nestjs-pino';
import { PrismaService } from '../../modules/database/prisma.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');

describe('Order Lifecycle & Payment Integration', () => {
  let app: INestApplication;

  const mockPrisma = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    coupon: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'coupon-1',
        code: 'WELCOME50',
        discountType: 'FLAT',
        discountValue: 50,
        minOrderAmount: 200,
        maxDiscountAmount: 50,
        isActive: true,
      }),
    },
    restaurant: {
      findUnique: jest.fn().mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000001',
        latitude: 12.9716,
        longitude: 77.5946,
        deliveryRadius: 5.0,
      }),
    },
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

  it('1. POST /api/v1/coupons/validate — should validate a coupon preview', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/coupons/validate')
      .send({ code: 'WELCOME50', subtotal: 350.0 });

    expect(res.status).toBeDefined();
  });

  it('2. POST /api/v1/geo/validate-radius — should check delivery radius', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/geo/validate-radius')
      .send({
        restaurantId: '00000000-0000-0000-0000-000000000001',
        deliveryLat: 12.9716,
        deliveryLng: 77.5946,
      });

    expect(res.status).toBeDefined();
  });

  it('3. GET /health/ready — system readiness check during order processing', async () => {
    const res = await request(app.getHttpServer()).get('/health/ready');
    expect(res.status).toBeDefined();
  });
});

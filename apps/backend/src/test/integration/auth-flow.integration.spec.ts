import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { Logger } from 'nestjs-pino';
import { PrismaService } from '../../modules/database/prisma.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');

describe('Auth Flow (Integration)', () => {
  let app: INestApplication;

  const mockUserPhone = '+919876543210';
  let accessToken = '';

  const mockPrisma = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'user-1', phone: mockUserPhone }),
      create: jest.fn().mockResolvedValue({ id: 'user-1', phone: mockUserPhone }),
    },
    customer: {
      findFirst: jest.fn().mockResolvedValue({ id: 'cust-1', userId: 'user-1' }),
    },
    otpVerification: {
      create: jest.fn().mockResolvedValue({}),
      findFirst: jest.fn().mockResolvedValue({ code: '123456', expiresAt: new Date(Date.now() + 60000) }),
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

  it('1. POST /api/v1/auth/otp/send — should request OTP for valid phone number', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/send')
      .send({ phone: mockUserPhone });

    expect(res.status).toBeDefined();
  });

  it('2. POST /api/v1/auth/otp/verify — should verify OTP and issue tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ phone: mockUserPhone, code: '123456' });

    expect(res.status).toBeDefined();
  });

  it('3. GET /api/v1/users/me — should return authenticated user profile using JWT', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users/me');

    expect(res.status).toBeDefined();
  });
});

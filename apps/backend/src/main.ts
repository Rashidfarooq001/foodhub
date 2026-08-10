import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import * as compression from 'compression';
import * as express from 'express';
import * as path from 'path';
import { AppModule } from './app.module';
import { PrismaService } from './modules/database/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Logger
  app.useLogger(app.get(Logger));

  // Security
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Compression
  app.use(compression());

  // Uploads (served on both /uploads and /api/v1/uploads with CORS & Caching headers)
  const uploadsPath = path.join(process.cwd(), 'uploads');
  const staticOptions = {
    setHeaders: (res: any) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    },
  };
  app.use('/uploads', express.static(uploadsPath, staticOptions));
  app.use('/api/v1/uploads', express.static(uploadsPath, staticOptions));



  // Body Size
  app.use(express.json({ limit: '120mb' }));
  app.use(express.urlencoded({ limit: '120mb', extended: true }));

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // Allowed Origins
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    ...(process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ];

  // CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Allow cross-origin requests from Vercel, localhost, and all client origins
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Request-ID',
    ],
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FoodHub Enterprise API')
    .setDescription('FoodHub Backend API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/v1/docs', app, document);

  // Auto-verify DB schema & apply delivery_mode if missing
  try {
    const prisma = app.get(PrismaService);
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeliveryMode') THEN
              CREATE TYPE "DeliveryMode" AS ENUM ('FOODHUB_DELIVERY', 'RESTAURANT_SELF_DELIVERY');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RestaurantDriverStatus') THEN
              CREATE TYPE "RestaurantDriverStatus" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'delivery_mode') THEN
              ALTER TABLE "restaurants" ADD COLUMN "delivery_mode" "DeliveryMode" NOT NULL DEFAULT 'FOODHUB_DELIVERY';
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'assigned_foodhub_driver_id') THEN
              ALTER TABLE "orders" ADD COLUMN "assigned_foodhub_driver_id" UUID;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'assigned_restaurant_driver_id') THEN
              ALTER TABLE "orders" ADD COLUMN "assigned_restaurant_driver_id" UUID;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'admin_dob_hash') THEN
              ALTER TABLE "users" ADD COLUMN "admin_dob_hash" TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'admin_favorite_person_hash') THEN
              ALTER TABLE "users" ADD COLUMN "admin_favorite_person_hash" TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'admin_recovery_token') THEN
              ALTER TABLE "users" ADD COLUMN "admin_recovery_token" TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'admin_recovery_expires_at') THEN
              ALTER TABLE "users" ADD COLUMN "admin_recovery_expires_at" TIMESTAMP(3);
          END IF;
      END $$;
    `);
    console.log('✅ Production Neon DB schema verified & updated successfully.');
  } catch (err: any) {
    console.warn('⚠️ Auto-schema verification notice:', err?.message || err);
  }

  // Start
  const port = Number(process.env.PORT) || 4000;

  await app.listen(port);

  console.log(`🚀 FoodHub Backend running on port ${port}`);
}

bootstrap();
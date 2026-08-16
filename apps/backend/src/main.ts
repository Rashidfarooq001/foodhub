import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpAdapterHost } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import * as compression from 'compression';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { PrismaService } from './modules/database/prisma.service';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Logger
  app.useLogger(app.get(Logger));

  // Security (Allow cross-origin image loading for Vercel frontends)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Compression
  app.use(compression());

  // Uploads (served on both /uploads and /api/v1/uploads with CORS & Caching headers)
  const uploadsPath = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  const staticOptions = {
    setHeaders: (res: any) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    },
  };

  app.use('/uploads', express.static(uploadsPath, staticOptions));
  app.use('/api/v1/uploads', express.static(uploadsPath, staticOptions));

  // Persistent Media Fallback: If disk file was wiped by container restart, restore from PostgreSQL DB
  const handleDbMediaFallback = async (req: any, res: any, next: any) => {
    try {
      const filename = path.basename(req.path || '');
      if (!filename || filename === '/' || filename === 'uploads') return next();

      const diskFilePath = path.join(uploadsPath, filename);
      if (fs.existsSync(diskFilePath)) return next();

      const prisma = app.get(PrismaService);
      const setting = await prisma.systemSetting.findUnique({
        where: { key: `media_file_${filename}` },
      });

      if (setting && setting.value) {
        const parsed = JSON.parse(setting.value);
        if (parsed.base64) {
          const buffer = Buffer.from(parsed.base64, 'base64');
          fs.writeFileSync(diskFilePath, buffer);
          res.setHeader('Content-Type', parsed.mimeType || 'image/jpeg');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return res.send(buffer);
        }
      }
    } catch {
      /* ignore and let 404 handler take over */
    }
    next();
  };

  app.use('/uploads', handleDbMediaFallback);
  app.use('/api/v1/uploads', handleDbMediaFallback);



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

  // Global Prisma Exception Filter
  // Converts database-level errors (P2002 duplicate, P2003 FK, P2025 not-found)
  // into clean HTTP 400/404/409 responses — never exposes raw Prisma stack traces.
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

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
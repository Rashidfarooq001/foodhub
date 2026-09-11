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
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';
import { ConfigService } from '@nestjs/config';

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

        if (parsed.s3Url) {
          return res.redirect(301, parsed.s3Url);
        }

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

  // Body Size (Strict 10MB limit for general API payloads to prevent DoS)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // Allowed Origins
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'https://zaykafood.online',
    ...(process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ];

  // CORS
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Request-ID', 'Cache-Control', 'Pragma'],
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

  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('api/v1/docs', app, document);
  }


  // Redis Socket.IO Adapter
  const configService = app.get(ConfigService);
  const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
  const redisPort = configService.get<number>('REDIS_PORT', 6379);
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(redisHost, redisPort);
  app.useWebSocketAdapter(redisIoAdapter);

  // Start
  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');

  const appLogger = app.get(Logger);
  appLogger.log(`🚀 FoodHub Core Backend API is running on: http://localhost:${port}/api/v1`);
  appLogger.log(`Instance: ${process.env.API_INSTANCE_ID || 'default'} | Role: ${process.env.NODE_ROLE || 'api'}`);

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  // Required for Docker SIGTERM / Kubernetes pod eviction.
  // NestJS app.close() cleanly drains in-flight requests, closes Prisma pool,
  // disconnects Redis, and closes the Socket.IO server before exit.
  const shutdown = async (signal: string) => {
    appLogger.log(`Received ${signal} — starting graceful shutdown`);
    try {
      await app.close();
      appLogger.log('Graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      appLogger.error('Error during shutdown', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

bootstrap();

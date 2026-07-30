import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import * as compression from 'compression';
import * as express from 'express';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Pino Logger
  app.useLogger(app.get(Logger));

  // Security Headers (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Gzip / Brotli Compression
  app.use(compression());

  // Serve uploaded media files statically
  const uploadsPath = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Request Body Size Limit for Media Uploads
  app.use(express.json({ limit: '120mb' }));
  app.use(express.urlencoded({ limit: '120mb', extended: true }));

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // Hardened CORS Configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];
app.enableCors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*',
});

  // Strict Request Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('FoodHub Enterprise Core API')
    .setDescription('Multi-restaurant food delivery platform REST & WebSockets API specification')
    .setVersion('1.0.0-PROD')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.setup('api/v1/docs', app, () =>
    SwaggerModule.createDocument(app, config),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`FoodHub Backend Core API running on port ${port}`);
}

bootstrap();

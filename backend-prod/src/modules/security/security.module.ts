import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { ConfigService } from '@nestjs/config';
import { GlobalHttpExceptionFilter } from './filters/http-exception.filter';
import { RequestIdInterceptor } from './interceptors/request-id.interceptor';
import { ResponseSanitizeInterceptor } from './interceptors/response-sanitize.interceptor';
import { FileUploadValidationGuard } from './guards/file-upload.guard';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000,
            limit: 10,
          },
          {
            name: 'medium',
            ttl: 10000,
            limit: 50,
          },
          {
            name: 'long',
            ttl: 60000,
            limit: 300,
          }
        ],
        storage: new ThrottlerStorageRedisService(
          `redis://${config.get('REDIS_HOST', 'localhost')}:${config.get('REDIS_PORT', 6379)}`
        ),
      }),
    }),
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalHttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseSanitizeInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    FileUploadValidationGuard,
  ],
  exports: [FileUploadValidationGuard],
})
export class SecurityModule {}

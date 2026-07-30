import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalHttpExceptionFilter } from './filters/http-exception.filter';
import { RequestIdInterceptor } from './interceptors/request-id.interceptor';
import { ResponseSanitizeInterceptor } from './interceptors/response-sanitize.interceptor';
import { FileUploadValidationGuard } from './guards/file-upload.guard';

@Module({
  providers: [
    { provide: APP_FILTER, useClass: GlobalHttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseSanitizeInterceptor },
    FileUploadValidationGuard,
  ],
  exports: [FileUploadValidationGuard],
})
export class SecurityModule {}

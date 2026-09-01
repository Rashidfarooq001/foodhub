import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const sanitized: any = {};
    for (const key of Object.keys(obj)) {
      if (
        key === 'passwordHash' ||
        key === 'password' ||
        key === 'refreshTokenHash' ||
        key === 'otpHash' ||
        key === 'secretKey'
      ) {
        continue;
      }
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

@Injectable()
export class ResponseSanitizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => sanitizeObject(data)));
  }
}

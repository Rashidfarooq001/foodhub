import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AbstractHttpAdapter } from '@nestjs/core';
import { Prisma } from '@prisma/client';

/**
 * Global NestJS exception filter that catches Prisma database errors and maps
 * them to human-readable HTTP responses.
 *
 * Prisma error codes handled:
 * - P2002: Unique constraint violation → 409 Conflict
 * - P2003: Foreign key constraint failure → 400 Bad Request
 * - P2025: Record not found → 404 Not Found
 * - P2011: Null constraint violation → 400 Bad Request
 * - P2006: Invalid value for field → 400 Bad Request
 *
 * This filter NEVER exposes internal Prisma stack traces or database column
 * names to the client.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  constructor(private readonly httpAdapter: AbstractHttpAdapter) {}

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    this.logger.error(
      `Prisma error ${exception.code} on ${request.method} ${request.url}: ${exception.message}`,
    );

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'A database error occurred. Please try again.';

    switch (exception.code) {
      case 'P2002': {
        // Unique constraint violation
        statusCode = HttpStatus.CONFLICT;
        const fields = (exception.meta?.target as string[] | undefined) ?? [];
        message = this.buildUniqueConstraintMessage(fields);
        break;
      }

      case 'P2003': {
        // Foreign key constraint failure
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'The referenced record does not exist. Please verify the submitted data.';
        break;
      }

      case 'P2025': {
        // Record not found
        statusCode = HttpStatus.NOT_FOUND;
        message = 'The requested record was not found.';
        break;
      }

      case 'P2011': {
        // Null constraint violation
        statusCode = HttpStatus.BAD_REQUEST;
        const field = (exception.meta?.constraint as string | undefined) ?? 'unknown field';
        message = `Required field is missing: ${field.replace(/_/g, ' ')}.`;
        break;
      }

      case 'P2006': {
        // Invalid value for field
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'One or more submitted values are invalid. Please check your input.';
        break;
      }

      default: {
        this.logger.error(
          `Unhandled Prisma error: ${exception.code} — ${exception.message}`,
        );
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'A database error occurred. Please contact support.';
        break;
      }
    }

    this.httpAdapter.reply(response, { statusCode, message, error: this.httpStatusToError(statusCode) }, statusCode);
  }

  private buildUniqueConstraintMessage(fields: string[]): string {
    const fieldStr = fields.join(', ');

    // Known field-level messages — add more as the schema grows
    if (fields.some((f) => f.toLowerCase().includes('phone'))) {
      return 'An account with this phone number is already registered. Please log in instead.';
    }
    if (fields.some((f) => f.toLowerCase().includes('email'))) {
      return 'An account with this email address is already registered. Please log in instead.';
    }
    if (fields.some((f) => f.toLowerCase().includes('license_number') || f.toLowerCase().includes('licensenumber'))) {
      return 'This driving license number is already registered with another account.';
    }
    if (fields.some((f) => f.toLowerCase().includes('vehicle_number') || f.toLowerCase().includes('vehiclenumber'))) {
      return 'This vehicle registration number is already registered with another account.';
    }
    if (fields.some((f) => f.toLowerCase().includes('fssai') || f.toLowerCase().includes('license_fssai'))) {
      return 'This FSSAI license number is already registered with another restaurant.';
    }
    if (fields.some((f) => f.toLowerCase().includes('gstin'))) {
      return 'This GSTIN is already registered with another restaurant.';
    }
    if (fields.some((f) => f.toLowerCase().includes('slug'))) {
      return 'A restaurant with a similar name already exists. Please use a more unique name.';
    }

    return `A record with this ${fieldStr.replace(/_/g, ' ')} already exists.`;
  }

  private httpStatusToError(status: number): string {
    switch (status) {
      case 400: return 'Bad Request';
      case 404: return 'Not Found';
      case 409: return 'Conflict';
      default:  return 'Internal Server Error';
    }
  }
}

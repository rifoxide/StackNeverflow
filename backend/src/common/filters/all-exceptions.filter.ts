import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

/**
 * Catch-all exception filter for unhandled errors (not HttpExceptions).
 * Implements requirement B9: consistent error response + security best practice.
 *
 * This filter catches any exception that wasn't handled by more specific filters.
 * It logs the full error internally but returns a generic 500 response to the client,
 * preventing leakage of sensitive implementation details (stack traces, internal paths).
 *
 * Register this BEFORE HttpExceptionFilter so specific handlers take precedence.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    // Log full error for debugging (server logs only, never sent to client)
    console.error('Unhandled exception:', exception);

    // Return generic 500 error (no internal details leaked)
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      errors: [],
    });
  }
}

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

/**
 * Global exception filter for handling all HttpExceptions (400-level, 500-level).
 * Implements requirement B9: consistent error response format.
 *
 * All error responses follow the format:
 * {
 *   success: false,
 *   statusCode: <HTTP status>,
 *   message: <human-readable error>,
 *   errors: <validation errors array, if any>
 * }
 *
 * Validation errors from class-validator are extracted and included
 * in the errors array for client-side field-level error display.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract message (can be string or object with message property)
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || 'An error occurred';

    // Extract validation errors array (from class-validator)
    const errors =
      typeof exceptionResponse === 'object' &&
      Array.isArray((exceptionResponse as any).message)
        ? (exceptionResponse as any).message
        : [];

    response.status(status).send({
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      errors,
    });
  }
}

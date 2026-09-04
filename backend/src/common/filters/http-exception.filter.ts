import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || 'An error occurred';

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

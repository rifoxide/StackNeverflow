import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Standard response envelope for all successful API responses.
 * Implements requirement B9: consistent request/response format.
 */
export interface Response<T> {
  success: boolean;
  data: T;
  message: string;
}

/**
 * Global interceptor that wraps all successful responses in a standard envelope.
 * All successful API responses will be in the format:
 * { success: true, data: <response>, message: "OK" }
 *
 * This ensures consistency across all endpoints and makes client-side
 * response handling predictable.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        message: 'OK',
      })),
    );
  }
}

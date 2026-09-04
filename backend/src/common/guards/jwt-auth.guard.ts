import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

/**
 * Global JWT authentication guard.
 * Protects all routes by default unless marked with @Public() decorator.
 *
 * This guard:
 * 1. Checks if the route has @Public() metadata
 * 2. If public, allows access without authentication
 * 3. If not public, delegates to passport-jwt strategy for validation
 * 4. On successful validation, request.user is populated by the strategy
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Otherwise, require JWT authentication
    return super.canActivate(context);
  }
}

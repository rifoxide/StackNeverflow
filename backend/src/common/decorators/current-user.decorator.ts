import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User } from '../../users/user.entity.js';

/**
 * Parameter decorator to extract the authenticated user from the request.
 * The user object is attached by the JWT strategy after token validation.
 *
 * Usage:
 * @Get('me')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

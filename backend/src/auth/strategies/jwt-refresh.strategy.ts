import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service.js';
import * as bcrypt from 'bcrypt';

interface FastifyRequestWithCookies {
  cookies?: Record<string, string>;
}

/**
 * JWT Refresh strategy for validating refresh tokens.
 * Extracts refresh token from httpOnly cookie and validates.
 * Also checks that the token matches the hashed version stored in DB.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: FastifyRequestWithCookies) => {
          return request.cookies?.refreshToken || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET')!,
      passReqToCallback: true, // Pass request to validate() to access cookie
    } as any);
  }

  /**
   * Validate refresh token payload and verify stored hash.
   * @param request - Fastify request (to access cookie)
   * @param payload - Decoded JWT payload { sub: userId, email }
   * @returns User object with refreshToken attached
   * @throws UnauthorizedException if user not found or token hash mismatch
   */
  async validate(request: FastifyRequestWithCookies, payload: { sub: string; email: string }) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify the refresh token matches the hash stored in DB
    const refreshToken = request.cookies?.refreshToken;
    if (!refreshToken || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return { ...user, refreshToken }; // Attach token for rotation
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service.js';

/**
 * JWT strategy for validating access tokens.
 * Extracts token from Authorization header and validates signature.
 * Attaches user to request object on success.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  /**
   * Validate JWT payload and return user.
   * Called automatically by Passport after token signature is verified.
   * @param payload - Decoded JWT payload { sub: userId, email }
   * @returns User object (attached to request.user)
   * @throws UnauthorizedException if user no longer exists
   */
  async validate(payload: { sub: string; email: string }) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user; // Attached to request.user
  }
}

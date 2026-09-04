import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

/**
 * Authentication module.
 * Handles user registration, login, and token management.
 * Imports UsersModule for user data access.
 * Configures JWT and Passport strategies.
 * Registers JwtAuthGuard as global guard (all routes protected by default unless @Public()).
 */
@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({}), // Empty config - strategies will specify their own secrets
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}

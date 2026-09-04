import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy.js';

/**
 * Authentication module.
 * Handles user registration, login, and token management.
 * Imports UsersModule for user data access.
 * Configures JWT and Passport strategies.
 */
@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({}), // Empty config - strategies will specify their own secrets
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}

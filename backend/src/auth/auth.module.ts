import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';

/**
 * Authentication module.
 * Handles user registration, login, and token management.
 * Imports UsersModule for user data access.
 */
@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}

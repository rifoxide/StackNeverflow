import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';

/**
 * Authentication controller.
 * Handles user registration, login, logout, and token refresh.
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user account.
   * POST /auth/register
   * Public endpoint (no authentication required).
   *
   * @param registerDto - User registration data
   * @returns Created user object (passwordHash excluded)
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (invalid email, password too short, etc.)',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already in use',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // Login, refresh, logout endpoints will be added in Step 1.3
}

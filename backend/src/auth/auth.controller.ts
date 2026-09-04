import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { FastifyReply } from 'fastify';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

interface FastifyRequestWithUser {
  user: any;
  cookies?: Record<string, string>;
}

interface FastifyReplyWithCookies extends FastifyReply {
  setCookie(name: string, value: string, options?: any): this;
  clearCookie(name: string, options?: any): this;
}

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

  /**
   * Login with email and password.
   * POST /auth/login
   * Returns access token in body, sets refresh token as httpOnly cookie.
   *
   * @param loginDto - Login credentials
   * @param res - Fastify response (for setting cookie)
   * @returns Object with accessToken
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns access token',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: FastifyReplyWithCookies,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.login(loginDto);

    // Set refresh token as httpOnly cookie
    res.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: '/',
    });

    return { accessToken };
  }

  /**
   * Refresh access token using refresh token from cookie.
   * POST /auth/refresh
   * Implements token rotation: issues new access + refresh tokens.
   *
   * @param req - Fastify request (to access user from refresh token validation)
   * @param res - Fastify response (for setting new cookie)
   * @returns Object with new accessToken
   */
  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refresh(
    @Req() req: FastifyRequestWithUser,
    @Res({ passthrough: true }) res: FastifyReplyWithCookies,
  ) {
    const { accessToken, refreshToken } = await this.authService.refresh(
      req.user.id,
    );

    // Set new refresh token as httpOnly cookie (token rotation)
    res.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return { accessToken };
  }

  /**
   * Logout user.
   * POST /auth/logout
   * Clears refresh token cookie and nullifies token in database.
   *
   * @param req - Fastify request (to get user ID)
   * @param res - Fastify response (for clearing cookie)
   */
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async logout(
    @Req() req: FastifyRequestWithUser,
    @Res({ passthrough: true }) res: FastifyReplyWithCookies,
  ) {
    await this.authService.logout(req.user.id);

    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return { message: 'Logout successful' };
  }

  /**
   * Get current authenticated user.
   * GET /auth/me
   * Returns user profile for currently logged in user.
   *
   * @param req - Fastify request (contains user from JWT validation)
   * @returns Current user object
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns current user',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  getMe(@Req() req: FastifyRequestWithUser) {
    return req.user;
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { User } from '../users/user.entity.js';
import * as bcrypt from 'bcrypt';

/**
 * Service handling authentication logic.
 * Implements requirements B1: registration and login with JWT tokens.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user.
   * Creates user with hashed password.
   * @param registerDto - Registration data (name, email, password)
   * @returns Created user (passwordHash excluded via class-transformer)
   * @throws ConflictException if email already exists
   */
  async register(registerDto: RegisterDto): Promise<User> {
    const { name, email, password } = registerDto;
    return this.usersService.create(name, email, password);
  }

  /**
   * Login user with email and password.
   * Generates JWT access token (15min) and refresh token (7 days).
   * Stores hashed refresh token in database.
   * @param loginDto - Login credentials
   * @returns Object with accessToken and refreshToken
   * @throws UnauthorizedException if credentials are invalid
   */
  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Store refresh token hash in database
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  /**
   * Refresh access token using refresh token.
   * Implements token rotation: generates new access + refresh tokens.
   * @param userId - User ID from validated refresh token
   * @returns New access token and refresh token
   */
  async refresh(
    userId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findById(userId);

    // Generate new tokens (token rotation)
    const tokens = await this.generateTokens(user.id, user.email);

    // Update refresh token hash in database
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  /**
   * Logout user by clearing refresh token.
   * Nullifies refreshTokenHash in database.
   * @param userId - User ID to logout
   */
  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  /**
   * Generate JWT access and refresh tokens.
   * Access token: 15 minutes (JWT_ACCESS_EXPIRATION env var, in seconds)
   * Refresh token: 7 days (JWT_REFRESH_EXPIRATION env var, in seconds)
   * @param userId - User ID for token payload
   * @param email - User email for token payload
   * @returns Object with accessToken and refreshToken
   */
  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email };

    const accessExpiration =
      this.configService.get<number>('JWT_ACCESS_EXPIRATION') || 900;
    const refreshExpiration =
      this.configService.get<number>('JWT_REFRESH_EXPIRATION') || 604800;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiration,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiration,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}

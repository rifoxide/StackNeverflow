import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { User } from '../users/user.entity.js';

/**
 * Service handling authentication logic.
 * Implements requirements B1: registration and login with JWT tokens.
 */
@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

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

  // Login and refresh token methods will be added in Step 1.3
}

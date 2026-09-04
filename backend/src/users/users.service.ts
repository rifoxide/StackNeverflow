import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity.js';
import * as bcrypt from 'bcrypt';

/**
 * Service handling user data operations.
 * Provides CRUD methods for User entity and password/token management.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Find a user by email.
   * Used during login and registration (duplicate check).
   * @returns User or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  /**
   * Find a user by ID.
   * Used for profile retrieval and token validation.
   * @throws NotFoundException if user doesn't exist
   */
  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Create a new user with hashed password.
   * @param name - User's display name
   * @param email - User's email (must be unique)
   * @param password - Plain text password (will be hashed with bcrypt, 12 rounds)
   * @throws ConflictException if email already exists
   */
  async create(name: string, email: string, password: string): Promise<User> {
    // Check for duplicate email
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash password with bcrypt (12 rounds for strong security)
    const passwordHash = await bcrypt.hash(password, 12);

    const user = this.usersRepository.create({
      name,
      email,
      passwordHash,
      refreshTokenHash: null,
    });

    return this.usersRepository.save(user);
  }

  /**
   * Update the user's refresh token hash.
   * Used during login (store new token) and logout (clear token).
   * @param userId - User ID
   * @param refreshToken - Plain refresh token to hash and store, or null to clear
   */
  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    const refreshTokenHash = refreshToken
      ? await bcrypt.hash(refreshToken, 12)
      : null;

    await this.usersRepository.update(userId, { refreshTokenHash });
  }
}

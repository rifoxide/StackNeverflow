import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Skill } from './skill.entity.js';
import { Experience } from './experience.entity.js';

/**
 * User entity representing a developer in the community.
 * Implements requirement B1: user authentication with password hashing.
 * Implements requirement B2: developer profile (via relations to Skills and Experiences).
 *
 * Security considerations:
 * - passwordHash is excluded from serialization via @Exclude()
 * - refreshTokenHash is also excluded (used for refresh token validation)
 * - Email has unique constraint to prevent duplicate accounts
 */
@Entity('users')
export class User {
  @ApiProperty({ description: 'User unique identifier', example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: 'User email address', example: 'john@example.com' })
  @Column({ unique: true, length: 255 })
  email: string;

  /**
   * Bcrypt hash of the user's password (12 rounds).
   * Never returned in API responses (excluded via class-transformer).
   */
  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  /**
   * Bcrypt hash of the current refresh token.
   * Null when user is logged out.
   * Used to validate refresh token rotation (one valid refresh token per user).
   */
  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true })
  refreshTokenHash: string | null;

  @ApiProperty({ description: 'Profile picture URL', example: '/uploads/avatars/abc123.jpg', required: false })
  @Column({ type: 'varchar', length: 500, nullable: true })
  profilePicture: string | null;

  @ApiProperty({ description: 'Account creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'User skills', type: () => [Skill] })
  @OneToMany(() => Skill, (skill) => skill.user)
  skills: Skill[];

  @ApiProperty({ description: 'User work experiences', type: () => [Experience] })
  @OneToMany(() => Experience, (experience) => experience.user)
  experiences: Experience[];
}

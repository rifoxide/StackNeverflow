import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Skill, (skill) => skill.user)
  skills: Skill[];

  @OneToMany(() => Experience, (experience) => experience.user)
  experiences: Experience[];
}

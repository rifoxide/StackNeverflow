import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

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
  @Column()
  passwordHash: string;

  /**
   * Bcrypt hash of the current refresh token.
   * Null when user is logged out.
   * Used to validate refresh token rotation (one valid refresh token per user).
   */
  @Exclude()
  @Column({ nullable: true })
  refreshTokenHash: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations to Skills and Experiences will be added in Step 2.1
  // @OneToMany(() => Skill, skill => skill.user)
  // skills: Skill[];
  //
  // @OneToMany(() => Experience, experience => experience.user)
  // experiences: Experience[];
}

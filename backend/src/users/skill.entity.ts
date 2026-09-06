import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Skill entity representing a developer's technical skill.
 * Part of developer profile (requirement B2).
 *
 * Many skills belong to one user.
 * Cascade delete: when user is deleted, their skills are deleted.
 */
@Entity('skills')
export class Skill {
  @ApiProperty({ description: 'Skill unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID this skill belongs to' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Skill name', example: 'TypeScript' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: 'Skill creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Associated user' })
  @ManyToOne('User', 'skills', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: any;
}

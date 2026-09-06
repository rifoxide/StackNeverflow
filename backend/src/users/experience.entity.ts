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
 * Experience entity representing a developer's work experience.
 * Part of developer profile (requirement B2).
 *
 * Many experiences belong to one user.
 * Cascade delete: when user is deleted, their experiences are deleted.
 */
@Entity('experiences')
export class Experience {
  @ApiProperty({ description: 'Experience unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID this experience belongs to' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Job title', example: 'Senior Software Engineer' })
  @Column({ length: 200 })
  title: string;

  @ApiProperty({ description: 'Company name', example: 'Acme Corp' })
  @Column({ length: 200 })
  company: string;

  @ApiProperty({ description: 'Start date', example: '2020-01-01' })
  @Column({ type: 'date' })
  fromDate: Date;

  @ApiProperty({ description: 'End date (null if current)', nullable: true, example: '2023-12-31' })
  @Column({ type: 'date', nullable: true })
  toDate: Date | null;

  @ApiProperty({ description: 'Job description', nullable: true, example: 'Led development of...' })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Experience creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Associated user' })
  @ManyToOne('User', 'experiences', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: any;
}

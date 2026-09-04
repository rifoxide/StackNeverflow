import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';

/**
 * Skill entity representing a developer's technical skill.
 * Part of developer profile (requirement B2).
 *
 * Many skills belong to one user.
 * Cascade delete: when user is deleted, their skills are deleted.
 */
@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ length: 100 })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('User', 'skills', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: any;
}

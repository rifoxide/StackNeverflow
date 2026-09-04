import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';

/**
 * Experience entity representing a developer's work experience.
 * Part of developer profile (requirement B2).
 *
 * Many experiences belong to one user.
 * Cascade delete: when user is deleted, their experiences are deleted.
 */
@Entity('experiences')
export class Experience {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 200 })
  company: string;

  @Column({ type: 'date' })
  fromDate: Date;

  @Column({ type: 'date', nullable: true })
  toDate: Date | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('User', 'experiences', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: any;
}

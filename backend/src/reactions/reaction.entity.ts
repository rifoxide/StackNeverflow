import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

/**
 * Target types for polymorphic reactions.
 * Same table holds likes/dislikes on both posts and comments.
 */
export type ReactionTargetType = 'post' | 'comment';

/**
 * Reaction type (like vs dislike).
 */
export type ReactionType = 'like' | 'dislike';

/**
 * Reaction entity.
 * Polymorphic: targetType + targetId pair identifies the target row.
 * One row per (user, target) — re-liking replaces the existing reaction.
 *
 * Note: no foreign key on targetId because PostgreSQL doesn't support
 * polymorphic FKs. The service layer is responsible for validating that
 * the target row exists (Post or Comment) before writing a reaction.
 */
@Entity('reactions')
@Unique('UQ_reactions_user_target', ['userId', 'targetType', 'targetId'])
@Index('IDX_reactions_target', ['targetType', 'targetId'])
export class Reaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 20 })
  targetType: ReactionTargetType;

  @Column({ type: 'uuid' })
  targetId: string;

  @Column({ type: 'varchar', length: 20 })
  type: ReactionType;

  @CreateDateColumn()
  createdAt: Date;
}

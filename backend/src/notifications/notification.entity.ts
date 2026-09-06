import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity.js';

/**
 * Notification types for different user actions.
 */
export enum NotificationType {
  POST_REACTION = 'post_reaction',
  POST_COMMENT = 'post_comment',
  COMMENT_REACTION = 'comment_reaction',
  COMMENT_REPLY = 'comment_reply',
}

/**
 * Notification entity for user notifications.
 *
 * Tracks notifications for:
 * - Reactions on posts (like/dislike)
 * - Comments on posts
 * - Reactions on comments (like/dislike)
 * - Replies to comments
 */
@Entity('notifications')
@Index(['recipientId', 'isRead', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  /**
   * User who receives this notification (post/comment author).
   */
  @Column('uuid')
  recipientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  /**
   * User who triggered the notification (reactor, commenter, replier).
   */
  @Column('uuid')
  actorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actorId' })
  actor: User;

  /**
   * ID of the post (for post reactions/comments) or parent comment (for comment reactions/replies).
   */
  @Column('uuid')
  targetId: string;

  /**
   * For comment-related notifications, this is the comment ID.
   * For post reactions, this is null.
   */
  @Column({ type: 'uuid', nullable: true })
  commentId: string | null;

  /**
   * Human-readable message for the notification.
   * Examples:
   * - "John Doe liked your post"
   * - "Jane Smith commented on your post"
   * - "Mike Johnson replied to your comment"
   */
  @Column({ type: 'text' })
  message: string;

  /**
   * Whether the recipient has read this notification.
   */
  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

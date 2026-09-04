import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';

/**
 * Comment entity.
 * Represents a comment on a post, with optional threading via parentCommentId.
 * Implements requirements B4 (comments) and B5 (replies / threading).
 *
 * Threading: a comment may have a parent (parentCommentId). Replies are
 * stored as flat rows; the frontend groups them into a tree.
 * Denormalized likesCount / dislikesCount updated transactionally by
 * the reactions service.
 */
@Entity('comments')
@Index('IDX_comments_postId', ['postId'])
@Index('IDX_comments_parentCommentId', ['parentCommentId'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  postId: string;

  @Column({ type: 'uuid' })
  authorId: string;

  /**
   * Null for top-level comments. Set to the parent comment's id for replies.
   */
  @Column({ type: 'uuid', nullable: true })
  parentCommentId: string | null;

  @Column({ type: 'text' })
  body: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'int', default: 0 })
  likesCount: number;

  @Column({ type: 'int', default: 0 })
  dislikesCount: number;

  @ManyToOne('Post', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: any;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: any;

  @ManyToOne('Comment', 'children', { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parentCommentId' })
  parent: Comment | null;

  @OneToMany('Comment', 'parent')
  children: Comment[];
}

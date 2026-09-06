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
import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({ description: 'Comment unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Post ID this comment belongs to' })
  @Column({ type: 'uuid' })
  postId: string;

  @ApiProperty({ description: 'Author user ID' })
  @Column({ type: 'uuid' })
  authorId: string;

  /**
   * Null for top-level comments. Set to the parent comment's id for replies.
   */
  @ApiProperty({ description: 'Parent comment ID (null for top-level)', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  parentCommentId: string | null;

  @ApiProperty({ description: 'Comment text content', example: 'Great question!' })
  @Column({ type: 'text' })
  body: string;

  @ApiProperty({ description: 'Comment creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'Number of likes', example: 5 })
  @Column({ type: 'int', default: 0 })
  likesCount: number;

  @ApiProperty({ description: 'Number of dislikes', example: 0 })
  @Column({ type: 'int', default: 0 })
  dislikesCount: number;

  @ApiProperty({ description: 'Associated post' })
  @ManyToOne('Post', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: any;

  @ApiProperty({ description: 'Comment author' })
  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: any;

  @ApiProperty({ description: 'Parent comment (for replies)', nullable: true })
  @ManyToOne('Comment', 'children', { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parentCommentId' })
  parent: Comment | null;

  @ApiProperty({ description: 'Child comments (replies)', type: () => [Comment] })
  @OneToMany('Comment', 'parent')
  children: Comment[];
}

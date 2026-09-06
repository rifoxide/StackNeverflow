import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Post entity.
 * Represents a question/post created by a developer (requirement B3).
 */
@Entity('posts')
@Index('IDX_posts_rankScore', ['rankScore'])
@Index('IDX_posts_createdAt', ['createdAt'])
export class Post {
  @ApiProperty({ description: 'Post unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Author user ID' })
  @Column({ type: 'uuid' })
  authorId: string;

  @ApiProperty({ description: 'Post title', example: 'How to use TypeORM migrations?' })
  @Column({ length: 255 })
  title: string;

  @ApiProperty({ description: 'Post body content (markdown supported)', example: 'I need help with...' })
  @Column({ type: 'text' })
  body: string;

  @ApiProperty({ description: 'Post creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'Number of likes', example: 10 })
  @Column({ type: 'int', default: 0 })
  likesCount: number;

  @ApiProperty({ description: 'Number of dislikes', example: 2 })
  @Column({ type: 'int', default: 0 })
  dislikesCount: number;

  @ApiProperty({ description: 'Number of comments', example: 5 })
  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @ApiProperty({ description: 'Calculated rank score for sorting', example: 18 })
  @Column({ type: 'float', default: 0 })
  rankScore: number;

  @ApiProperty({ description: 'Post author' })
  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: any;
}

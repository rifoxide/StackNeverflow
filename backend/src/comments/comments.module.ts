import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsController } from './comments.controller.js';
import { CommentsService } from './comments.service.js';
import { Comment } from './comment.entity.js';
import { Post } from '../posts/post.entity.js';
import { PostsModule } from '../posts/posts.module.js';

/**
 * Comments module.
 * Wires up the comment entity, controller, and service.
 * PostsModule is imported for the `Post` repository (used to validate
 * the post exists and to increment `commentCount`).
 */
@Module({
  imports: [TypeOrmModule.forFeature([Comment, Post]), PostsModule],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}

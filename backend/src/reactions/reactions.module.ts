import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReactionsController } from './reactions.controller.js';
import { ReactionsService } from './reactions.service.js';
import { Reaction } from './reaction.entity.js';
import { Post } from '../posts/post.entity.js';
import { Comment } from '../comments/comment.entity.js';
import { PostsModule } from '../posts/posts.module.js';
import { CommentsModule } from '../comments/comments.module.js';

/**
 * Reactions module.
 *
 * Polymorphic likes/dislikes on posts and comments. The reactions
 * service needs the Post and Comment repositories to validate targets
 * and to update denormalized count columns inside the same transaction
 * as the reaction write.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Reaction, Post, Comment]),
    PostsModule,
    CommentsModule,
  ],
  controllers: [ReactionsController],
  providers: [ReactionsService],
  exports: [ReactionsService],
})
export class ReactionsModule {}

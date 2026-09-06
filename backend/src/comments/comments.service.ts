import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Comment } from './comment.entity.js';
import { Post } from '../posts/post.entity.js';
import { User } from '../users/user.entity.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { PostsService } from '../posts/posts.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

/**
 * Service for managing comments and replies.
 * Implements requirements B4 (comments) and B5 (threaded replies).
 */
@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly dataSource: DataSource,
    private readonly postsService: PostsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Create a comment or reply on a post.
   *
   * If `parentCommentId` is provided, validates that the parent exists and
   * belongs to the same post; otherwise rejects with 400.
   *
   * The create + post.commentCount increment run in a single transaction so
   * the denormalized count never drifts from the actual comment rows.
   *
   * @param postId - Target post id
   * @param authorId - Author user id
   * @param dto - Comment body and optional parent
   * @returns Created comment with author relation
   */
  async create(
    postId: string,
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    return this.dataSource.transaction(async (manager) => {
      // Verify post exists. Done inside the transaction so the FK is
      // authoritative — if the post is missing we get a clean 404.
      const post = await manager.findOne(Post, {
        where: { id: postId },
        relations: { author: true },
      });
      if (!post) {
        throw new NotFoundException(`Post with ID ${postId} not found`);
      }

      // Get the comment author for notification
      const author = await manager.findOne(User, { where: { id: authorId } });
      if (!author) {
        throw new NotFoundException(`User with ID ${authorId} not found`);
      }

      // Validate parent comment if replying
      let parentComment: Comment | null = null;
      if (dto.parentCommentId) {
        parentComment = await manager.findOne(Comment, {
          where: { id: dto.parentCommentId },
          relations: { author: true },
        });
        if (!parentComment) {
          throw new BadRequestException(
            `Parent comment with ID ${dto.parentCommentId} not found`,
          );
        }
        if (parentComment.postId !== postId) {
          throw new BadRequestException(
            'Parent comment belongs to a different post',
          );
        }
      }

      // Create the comment
      const comment = manager.create(Comment, {
        postId,
        authorId,
        parentCommentId: dto.parentCommentId ?? null,
        body: dto.body,
        likesCount: 0,
        dislikesCount: 0,
      });
      const saved = await manager.save(comment);

      // Increment denormalized post comment count
      await manager.increment(Post, { id: postId }, 'commentCount', 1);

      // Recalculate rank score after incrementing comment count
      // Must happen outside the transaction to avoid deadlock
      setImmediate(() => {
        void this.postsService.recalculateRankScore(postId);
      });

      // Create notification
      if (parentComment) {
        // Reply to comment notification
        setImmediate(() => {
          void this.notificationsService.createCommentReplyNotification(
            parentComment.author.id,
            authorId,
            author.name,
            saved.id,
            postId,
          );
        });
      } else {
        // Comment on post notification
        setImmediate(() => {
          void this.notificationsService.createPostCommentNotification(
            postId,
            post.author.id,
            authorId,
            author.name,
            saved.id,
          );
        });
      }

      // Return with author loaded so the response includes name
      return manager.findOne(Comment, {
        where: { id: saved.id },
        relations: { author: true },
      }) as Promise<Comment>;
    });
  }

  /**
   * Return a flat list of comments for a post (ordered by createdAt ASC).
   * Frontend builds the tree by grouping on parentCommentId.
   *
   * @param postId - Post id
   * @returns Comments with author relation
   */
  async findAllForPost(postId: string): Promise<Comment[]> {
    // Ensure the post exists; clearer 404 than returning an empty list
    // when the post id is wrong.
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    return this.commentRepository.find({
      where: { postId },
      relations: { author: true },
      order: { createdAt: 'ASC' },
    });
  }
}

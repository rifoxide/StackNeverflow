import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Reaction, ReactionTargetType } from './reaction.entity.js';
import { Post } from '../posts/post.entity.js';
import { Comment } from '../comments/comment.entity.js';
import { ToggleReactionDto } from './dto/toggle-reaction.dto.js';

/**
 * Result of toggling a reaction.
 * `userReaction` is the new effective state (null if toggled off).
 */
export interface ToggleResult {
  userReaction: 'like' | 'dislike' | null;
  likesCount: number;
  dislikesCount: number;
}

/**
 * Service for managing polymorphic reactions on posts and comments.
 *
 * Toggle semantics (one row per (user, target)):
 *   - no existing row → create the new reaction
 *   - same type        → remove (toggle off)
 *   - opposite type    → switch (update type)
 *
 * Counts on the target row are denormalized for read performance and
 * updated inside the same transaction as the reaction write.
 */
@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(Reaction)
    private readonly reactionRepository: Repository<Reaction>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly dataSource: DataSource,
  ) {
    // Repositories are reserved for non-transactional reads. Mutating
    // paths always go through the dataSource transaction so writes stay
    // consistent with count updates.
    void this.postRepository;
    void this.commentRepository;
  }

  /**
   * Toggle a reaction for a user on a target.
   *
   * @param userId - Acting user
   * @param dto - Target + desired reaction type
   * @returns New user reaction state + updated counts
   */
  async toggle(userId: string, dto: ToggleReactionDto): Promise<ToggleResult> {
    return this.dataSource.transaction(async (manager) => {
      // Validate target exists. We pull it explicitly so we can return
      // a clean 404 instead of an FK error, and so we can update the
      // correct count columns afterwards.
      let post: Post | null = null;
      let comment: Comment | null = null;

      if (dto.targetType === 'post') {
        post = await manager.findOne(Post, { where: { id: dto.targetId } });
        if (!post) {
          throw new NotFoundException(`Post with ID ${dto.targetId} not found`);
        }
      } else {
        comment = await manager.findOne(Comment, {
          where: { id: dto.targetId },
        });
        if (!comment) {
          throw new NotFoundException(
            `Comment with ID ${dto.targetId} not found`,
          );
        }
      }

      // Look for existing reaction
      const existing = await manager.findOne(Reaction, {
        where: {
          userId,
          targetType: dto.targetType,
          targetId: dto.targetId,
        },
      });

      let nextReaction: 'like' | 'dislike' | null = dto.type;

      if (existing) {
        if (existing.type === dto.type) {
          // Toggle off — same type → remove
          await manager.delete(Reaction, { id: existing.id });
          nextReaction = null;
        } else {
          // Switch — opposite type → update
          existing.type = dto.type;
          await manager.save(Reaction, existing);
        }
      } else {
        // No existing reaction → create
        const reaction = manager.create(Reaction, {
          userId,
          targetType: dto.targetType,
          targetId: dto.targetId,
          type: dto.type,
        });
        await manager.save(Reaction, reaction);
      }

      // Recalculate denormalized counts from the source of truth.
      // COUNT queries are cheap because we have an index on (targetType, targetId).
      const likeCount = await manager.count(Reaction, {
        where: { targetType: dto.targetType, targetId: dto.targetId, type: 'like' },
      });
      const dislikeCount = await manager.count(Reaction, {
        where: {
          targetType: dto.targetType,
          targetId: dto.targetId,
          type: 'dislike',
        },
      });

      if (post) {
        await manager.update(Post, post.id, {
          likesCount: likeCount,
          dislikesCount: dislikeCount,
        });
      } else if (comment) {
        await manager.update(Comment, comment!.id, {
          likesCount: likeCount,
          dislikesCount: dislikeCount,
        });
      }

      return {
        userReaction: nextReaction,
        likesCount: likeCount,
        dislikesCount: dislikeCount,
      };
    });
  }

  /**
   * Get the current user's reaction on a target (null if none).
   */
  async getUserReaction(
    userId: string,
    targetType: ReactionTargetType,
    targetId: string,
  ): Promise<'like' | 'dislike' | null> {
    const r = await this.reactionRepository.findOne({
      where: { userId, targetType, targetId },
    });
    return r ? r.type : null;
  }

  /**
   * Batch fetch current user's reactions for many targets.
   * Used by the feed to avoid N+1 calls when rendering reaction buttons.
   *
   * @returns Map of targetId → reaction type (or null)
   */
  async getUserReactionsBatch(
    userId: string,
    targetType: ReactionTargetType,
    targetIds: string[],
  ): Promise<Record<string, 'like' | 'dislike' | null>> {
    if (targetIds.length === 0) {
      return {};
    }

    // Validate limit so a malicious caller can't pull the whole table.
    if (targetIds.length > 200) {
      throw new BadRequestException(
        'targetIds supports at most 200 ids per request',
      );
    }

    const rows = await this.reactionRepository.find({
      where: { userId, targetType },
    });

    const allowed = new Set(targetIds);
    const result: Record<string, 'like' | 'dislike' | null> = {};
    for (const id of targetIds) {
      result[id] = null;
    }
    for (const r of rows) {
      if (allowed.has(r.targetId)) {
        result[r.targetId] = r.type;
      }
    }
    return result;
  }
}

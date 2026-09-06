import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ReactionsService } from './reactions.service.js';
import { Reaction } from './reaction.entity.js';
import { Post } from '../posts/post.entity.js';
import { Comment } from '../comments/comment.entity.js';
import { PostsService } from '../posts/posts.service.js';

describe('ReactionsService', () => {
  let service: ReactionsService;

  const mockReactionRepository = {
    findOne: vi.fn(),
    find: vi.fn(),
  };

  const mockPostRepository = {};
  const mockCommentRepository = {};

  const mockPostsService = {
    recalculateRankScore: vi.fn(),
  };

  const mockEntityManager = {
    findOne: vi.fn(),
    delete: vi.fn(),
    save: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  };

  const mockDataSource = {
    transaction: vi.fn((callback) => callback(mockEntityManager)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionsService,
        {
          provide: getRepositoryToken(Reaction),
          useValue: mockReactionRepository,
        },
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepository,
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: mockCommentRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: PostsService,
          useValue: mockPostsService,
        },
      ],
    }).compile();

    service = module.get<ReactionsService>(ReactionsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('toggle', () => {
    const userId = 'user-123';
    const postId = 'post-123';

    it('should create a new reaction when none exists', async () => {
      const dto = { targetType: 'post' as const, targetId: postId, type: 'like' as const };
      const post = { id: postId } as Post;

      mockEntityManager.findOne
        .mockResolvedValueOnce(post) // Post lookup
        .mockResolvedValueOnce(null); // No existing reaction

      mockEntityManager.create.mockReturnValue({ userId, ...dto });
      mockEntityManager.count
        .mockResolvedValueOnce(1) // likeCount
        .mockResolvedValueOnce(0); // dislikeCount

      const result = await service.toggle(userId, dto);

      expect(mockEntityManager.save).toHaveBeenCalled();
      expect(mockEntityManager.update).toHaveBeenCalledWith(
        Post,
        postId,
        { likesCount: 1, dislikesCount: 0 },
      );
      expect(result).toEqual({
        userReaction: 'like',
        likesCount: 1,
        dislikesCount: 0,
      });
    });

    it('should remove reaction when toggling same type', async () => {
      const dto = { targetType: 'post' as const, targetId: postId, type: 'like' as const };
      const post = { id: postId } as Post;
      const existingReaction = { id: 'reaction-123', type: 'like' };

      mockEntityManager.findOne
        .mockResolvedValueOnce(post)
        .mockResolvedValueOnce(existingReaction);

      mockEntityManager.count
        .mockResolvedValueOnce(0) // likeCount after removal
        .mockResolvedValueOnce(0); // dislikeCount

      const result = await service.toggle(userId, dto);

      expect(mockEntityManager.delete).toHaveBeenCalledWith(Reaction, {
        id: existingReaction.id,
      });
      expect(result.userReaction).toBeNull();
    });

    it('should switch reaction when toggling opposite type', async () => {
      const dto = { targetType: 'post' as const, targetId: postId, type: 'like' as const };
      const post = { id: postId } as Post;
      const existingReaction = { id: 'reaction-123', type: 'dislike' };

      mockEntityManager.findOne
        .mockResolvedValueOnce(post)
        .mockResolvedValueOnce(existingReaction);

      mockEntityManager.count
        .mockResolvedValueOnce(1) // likeCount
        .mockResolvedValueOnce(0); // dislikeCount after switch

      const result = await service.toggle(userId, dto);

      expect(mockEntityManager.save).toHaveBeenCalledWith(
        Reaction,
        expect.objectContaining({ type: 'like' }),
      );
      expect(result).toEqual({
        userReaction: 'like',
        likesCount: 1,
        dislikesCount: 0,
      });
    });

    it('should update comment counts for comment reactions', async () => {
      const commentId = 'comment-123';
      const dto = { targetType: 'comment' as const, targetId: commentId, type: 'like' as const };
      const comment = { id: commentId } as Comment;

      // The service checks targetType first - for 'comment' it skips post lookup
      mockEntityManager.findOne
        .mockResolvedValueOnce(comment) // Comment lookup (targetType is 'comment')
        .mockResolvedValueOnce(null); // No existing reaction

      mockEntityManager.create.mockReturnValue({ userId, ...dto });
      mockEntityManager.count
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0);

      await service.toggle(userId, dto);

      expect(mockEntityManager.update).toHaveBeenCalledWith(
        Comment,
        commentId,
        { likesCount: 1, dislikesCount: 0 },
      );
    });

    it('should throw NotFoundException if post not found', async () => {
      const dto = { targetType: 'post' as const, targetId: postId, type: 'like' as const };

      mockEntityManager.findOne.mockResolvedValueOnce(null); // Post not found

      await expect(service.toggle(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.toggle(userId, dto)).rejects.toThrow(
        `Post with ID ${postId} not found`,
      );

      // Clear the mock for the second expect call
      mockEntityManager.findOne.mockClear();
      mockEntityManager.findOne.mockResolvedValueOnce(null);
    });

    it('should throw NotFoundException if comment not found', async () => {
      const commentId = 'comment-123';
      const dto = { targetType: 'comment' as const, targetId: commentId, type: 'like' as const };

      mockEntityManager.findOne
        .mockResolvedValueOnce(null) // No post
        .mockResolvedValueOnce(null); // Comment not found

      await expect(service.toggle(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserReaction', () => {
    it('should return reaction type if exists', async () => {
      const reaction = { type: 'like' as const };
      mockReactionRepository.findOne.mockResolvedValue(reaction);

      const result = await service.getUserReaction(
        'user-123',
        'post',
        'post-123',
      );

      expect(result).toBe('like');
    });

    it('should return null if no reaction exists', async () => {
      mockReactionRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserReaction(
        'user-123',
        'post',
        'post-123',
      );

      expect(result).toBeNull();
    });
  });

  describe('getUserReactionsBatch', () => {
    it('should return map of reactions for multiple targets', async () => {
      const targetIds = ['post-1', 'post-2', 'post-3'];
      const reactions = [
        { targetId: 'post-1', type: 'like' as const },
        { targetId: 'post-3', type: 'dislike' as const },
      ];

      mockReactionRepository.find.mockResolvedValue(reactions);

      const result = await service.getUserReactionsBatch(
        'user-123',
        'post',
        targetIds,
      );

      expect(result).toEqual({
        'post-1': 'like',
        'post-2': null,
        'post-3': 'dislike',
      });
    });

    it('should return empty object for empty target list', async () => {
      const result = await service.getUserReactionsBatch(
        'user-123',
        'post',
        [],
      );

      expect(result).toEqual({});
      expect(mockReactionRepository.find).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if too many target ids', async () => {
      const targetIds = Array(201).fill('post-id');

      await expect(
        service.getUserReactionsBatch('user-123', 'post', targetIds),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getUserReactionsBatch('user-123', 'post', targetIds),
      ).rejects.toThrow('targetIds supports at most 200 ids per request');
    });
  });
});

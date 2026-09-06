import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CommentsService } from './comments.service.js';
import { Comment } from './comment.entity.js';
import { Post } from '../posts/post.entity.js';
import { PostsService } from '../posts/posts.service.js';

describe('CommentsService', () => {
  let service: CommentsService;

  const mockCommentRepository = {
    find: vi.fn(),
  };

  const mockPostRepository = {
    findOne: vi.fn(),
  };

  const mockPostsService = {
    recalculateRankScore: vi.fn(),
  };

  const mockEntityManager = {
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    increment: vi.fn(),
  };

  const mockDataSource = {
    transaction: vi.fn((callback) => callback(mockEntityManager)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getRepositoryToken(Comment),
          useValue: mockCommentRepository,
        },
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepository,
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

    service = module.get<CommentsService>(CommentsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    const postId = 'post-123';
    const authorId = 'user-123';

    it('should create a top-level comment', async () => {
      const dto = { body: 'Great post!', parentCommentId: undefined };
      const post = { id: postId } as Post;
      const createdComment = {
        id: 'comment-123',
        postId,
        authorId,
        body: dto.body,
        parentCommentId: null,
      } as Comment;

      mockEntityManager.findOne
        .mockResolvedValueOnce(post) // Post lookup
        .mockResolvedValueOnce(createdComment); // Return with author

      mockEntityManager.create.mockReturnValue(createdComment);
      mockEntityManager.save.mockResolvedValue(createdComment);

      const result = await service.create(postId, authorId, dto);

      expect(mockEntityManager.create).toHaveBeenCalledWith(Comment, {
        postId,
        authorId,
        parentCommentId: null,
        body: dto.body,
        likesCount: 0,
        dislikesCount: 0,
      });
      expect(mockEntityManager.increment).toHaveBeenCalledWith(
        Post,
        { id: postId },
        'commentCount',
        1,
      );
      expect(result).toEqual(createdComment);
    });

    it('should create a reply with valid parent', async () => {
      const parentCommentId = 'comment-parent';
      const dto = { body: 'Thanks!', parentCommentId };
      const post = { id: postId } as Post;
      const parentComment = { id: parentCommentId, postId } as Comment;
      const createdReply = {
        id: 'comment-reply',
        postId,
        authorId,
        body: dto.body,
        parentCommentId,
      } as Comment;

      mockEntityManager.findOne
        .mockResolvedValueOnce(post) // Post lookup
        .mockResolvedValueOnce(parentComment) // Parent comment lookup
        .mockResolvedValueOnce(createdReply); // Return with author

      mockEntityManager.create.mockReturnValue(createdReply);
      mockEntityManager.save.mockResolvedValue(createdReply);

      const result = await service.create(postId, authorId, dto);

      expect(mockEntityManager.create).toHaveBeenCalledWith(
        Comment,
        expect.objectContaining({ parentCommentId }),
      );
      expect(result).toEqual(createdReply);
    });

    it('should throw NotFoundException if post not found', async () => {
      const dto = { body: 'Comment', parentCommentId: undefined };
      mockEntityManager.findOne.mockResolvedValueOnce(null); // Post not found

      await expect(service.create(postId, authorId, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(postId, authorId, dto)).rejects.toThrow(
        `Post with ID ${postId} not found`,
      );
    });

    it('should throw BadRequestException if parent comment not found', async () => {
      const parentCommentId = 'nonexistent';
      const dto = { body: 'Reply', parentCommentId };
      const post = { id: postId } as Post;

      mockEntityManager.findOne
        .mockResolvedValueOnce(post) // Post found
        .mockResolvedValueOnce(null); // Parent comment not found

      await expect(service.create(postId, authorId, dto)).rejects.toThrow(
        BadRequestException,
      );

      // Reset and mock again for the second expect
      mockEntityManager.findOne.mockClear();
      mockEntityManager.findOne
        .mockResolvedValueOnce(post)
        .mockResolvedValueOnce(null);

      await expect(service.create(postId, authorId, dto)).rejects.toThrow(
        `Parent comment with ID ${parentCommentId} not found`,
      );
    });

    it('should throw BadRequestException if parent belongs to different post', async () => {
      const parentCommentId = 'comment-other';
      const dto = { body: 'Reply', parentCommentId };
      const post = { id: postId } as Post;
      const parentComment = { id: parentCommentId, postId: 'other-post' } as Comment;

      mockEntityManager.findOne
        .mockResolvedValueOnce(post) // Post found
        .mockResolvedValueOnce(parentComment); // Parent from different post

      await expect(service.create(postId, authorId, dto)).rejects.toThrow(
        BadRequestException,
      );

      // Reset and mock again for the second expect
      mockEntityManager.findOne.mockClear();
      mockEntityManager.findOne
        .mockResolvedValueOnce(post)
        .mockResolvedValueOnce(parentComment);

      await expect(service.create(postId, authorId, dto)).rejects.toThrow(
        'Parent comment belongs to a different post',
      );
    });

    it('should increment commentCount in transaction', async () => {
      const dto = { body: 'Comment', parentCommentId: undefined };
      const post = { id: postId } as Post;
      const createdComment = { id: 'comment-123' } as Comment;

      mockEntityManager.findOne
        .mockResolvedValueOnce(post)
        .mockResolvedValueOnce(createdComment);

      mockEntityManager.create.mockReturnValue(createdComment);
      mockEntityManager.save.mockResolvedValue(createdComment);

      await service.create(postId, authorId, dto);

      expect(mockEntityManager.increment).toHaveBeenCalledWith(
        Post,
        { id: postId },
        'commentCount',
        1,
      );
    });
  });

  describe('findAllForPost', () => {
    const postId = 'post-123';

    it('should return comments ordered by createdAt ASC', async () => {
      const post = { id: postId } as Post;
      const comments = [
        { id: '1', body: 'First', createdAt: new Date('2024-01-01') },
        { id: '2', body: 'Second', createdAt: new Date('2024-01-02') },
      ] as Comment[];

      mockPostRepository.findOne.mockResolvedValue(post);
      mockCommentRepository.find.mockResolvedValue(comments);

      const result = await service.findAllForPost(postId);

      expect(mockPostRepository.findOne).toHaveBeenCalledWith({
        where: { id: postId },
      });
      expect(mockCommentRepository.find).toHaveBeenCalledWith({
        where: { postId },
        relations: { author: true },
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(comments);
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(service.findAllForPost(postId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findAllForPost(postId)).rejects.toThrow(
        `Post with ID ${postId} not found`,
      );
    });

    it('should return empty array if no comments exist', async () => {
      const post = { id: postId } as Post;
      mockPostRepository.findOne.mockResolvedValue(post);
      mockCommentRepository.find.mockResolvedValue([]);

      const result = await service.findAllForPost(postId);

      expect(result).toEqual([]);
    });
  });
});

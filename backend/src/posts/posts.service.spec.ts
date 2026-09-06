import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ILike } from 'typeorm';
import { PostsService } from './posts.service.js';
import { Post } from './post.entity.js';

describe('PostsService', () => {
  let service: PostsService;

  const mockRepository = {
    create: vi.fn(),
    save: vi.fn(),
    findAndCount: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(Post),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new post', async () => {
      const authorId = 'author-123';
      const createPostDto = {
        title: 'Test Post',
        body: 'Test body',
      };

      const createdPost = {
        id: 'post-123',
        ...createPostDto,
        authorId,
        likesCount: 0,
        dislikesCount: 0,
        commentCount: 0,
        rankScore: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Post;

      mockRepository.create.mockReturnValue(createdPost);
      mockRepository.save.mockResolvedValue(createdPost);

      const result = await service.create(authorId, createPostDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createPostDto,
        authorId,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createdPost);
      expect(result).toEqual(createdPost);
    });
  });

  describe('findAll', () => {
    it('should return paginated posts ordered by rankScore and createdAt', async () => {
      const posts = [
        {
          id: '1',
          title: 'Post 1',
          rankScore: 10,
          createdAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          title: 'Post 2',
          rankScore: 5,
          createdAt: new Date('2024-01-02'),
        },
      ] as Post[];

      mockRepository.findAndCount.mockResolvedValue([posts, 2]);

      const result = await service.findAll(1, 20);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        relations: { author: true },
        order: {
          rankScore: 'DESC',
          createdAt: 'DESC',
        },
        skip: 0,
        take: 20,
      });
      expect(result.data).toEqual(posts);
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('should filter posts by search term', async () => {
      const posts = [
        { id: '1', title: 'JavaScript Tips', body: 'Some tips' },
      ] as Post[];

      mockRepository.findAndCount.mockResolvedValue([posts, 1]);

      await service.findAll(1, 20, 'JavaScript');

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: [
          { title: ILike('%JavaScript%') },
          { body: ILike('%JavaScript%') },
        ],
        relations: { author: true },
        order: {
          rankScore: 'DESC',
          createdAt: 'DESC',
        },
        skip: 0,
        take: 20,
      });
    });

    it('should handle pagination correctly', async () => {
      const posts = [] as Post[];
      mockRepository.findAndCount.mockResolvedValue([posts, 45]);

      const result = await service.findAll(3, 10);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
      expect(result.meta).toEqual({
        page: 3,
        limit: 10,
        total: 45,
        totalPages: 5,
      });
    });
  });

  describe('findOne', () => {
    it('should return a post with author', async () => {
      const post = {
        id: 'post-123',
        title: 'Test',
        author: { id: 'author-123', name: 'John' },
      } as Post;

      mockRepository.findOne.mockResolvedValue(post);

      const result = await service.findOne('post-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'post-123' },
        relations: { author: true },
      });
      expect(result).toEqual(post);
    });

    it('should throw NotFoundException if post not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Post with ID nonexistent not found',
      );
    });
  });

  describe('recalculateRankScore', () => {
    it('should calculate rank score using formula: (likes - dislikes) + (comments * 2)', async () => {
      const post = {
        id: 'post-123',
        likesCount: 10,
        dislikesCount: 2,
        commentCount: 5,
      } as Post;

      mockRepository.findOne.mockResolvedValue(post);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.recalculateRankScore('post-123');

      // Expected: (10 - 2) + (5 * 2) = 8 + 10 = 18
      expect(mockRepository.update).toHaveBeenCalledWith('post-123', {
        rankScore: 18,
      });
    });

    it('should handle zero counts', async () => {
      const post = {
        id: 'post-123',
        likesCount: 0,
        dislikesCount: 0,
        commentCount: 0,
      } as Post;

      mockRepository.findOne.mockResolvedValue(post);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.recalculateRankScore('post-123');

      expect(mockRepository.update).toHaveBeenCalledWith('post-123', {
        rankScore: 0,
      });
    });

    it('should handle negative net likes', async () => {
      const post = {
        id: 'post-123',
        likesCount: 2,
        dislikesCount: 10,
        commentCount: 1,
      } as Post;

      mockRepository.findOne.mockResolvedValue(post);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.recalculateRankScore('post-123');

      // Expected: (2 - 10) + (1 * 2) = -8 + 2 = -6
      expect(mockRepository.update).toHaveBeenCalledWith('post-123', {
        rankScore: -6,
      });
    });

    it('should throw NotFoundException if post not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.recalculateRankScore('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Post } from './post.entity.js';
import { CreatePostDto } from './dto/create-post.dto.js';

/**
 * Service for managing posts.
 * Handles CRUD operations, pagination, search, and ranking.
 */
@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  /**
   * Create a new post.
   *
   * @param authorId - ID of the post author
   * @param createPostDto - Post data
   * @returns Created post
   */
  async create(authorId: string, createPostDto: CreatePostDto): Promise<Post> {
    const post = this.postRepository.create({
      ...createPostDto,
      authorId,
    });

    return await this.postRepository.save(post);
  }

  /**
   * Find all posts with pagination and optional search.
   * Ordered by rankScore DESC, createdAt DESC.
   * Includes author information (id, name).
   *
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @param search - Optional search keyword for title/body
   * @returns Paginated posts with metadata
   */
  async findAll(
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<{
    data: Post[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const offset = (page - 1) * limit;

    // Build where clause for search
    const where = search
      ? [
          { title: ILike(`%${search}%`) },
          { body: ILike(`%${search}%`) },
        ]
      : {};

    const [data, total] = await this.postRepository.findAndCount({
      where,
      relations: {
        author: true,
      },
      order: {
        rankScore: 'DESC',
        createdAt: 'DESC',
      },
      skip: offset,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Find a single post by ID.
   * Includes author information.
   *
   * @param id - Post ID
   * @returns Post with author
   * @throws NotFoundException if post not found
   */
  async findOne(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: {
        author: true,
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  /**
   * Recalculate post rank score.
   * Formula: (likesCount - dislikesCount) + (commentCount * 2)
   *
   * @param postId - Post ID
   */
  async recalculateRankScore(postId: string): Promise<void> {
    const post = await this.postRepository.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    const score =
      post.likesCount - post.dislikesCount + post.commentCount * 2;

    await this.postRepository.update(postId, { rankScore: score });
  }
}

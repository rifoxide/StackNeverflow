import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PostsService } from './posts.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { Public } from '../common/decorators/public.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { User } from '../users/user.entity.js';

/**
 * Posts controller.
 * Manages post creation, retrieval, pagination, and search.
 */
@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * Create a new post.
   * POST /posts
   * Protected endpoint - requires authentication.
   *
   * @param user - Current authenticated user
   * @param createPostDto - Post data
   * @returns Created post
   */
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async create(
    @CurrentUser() user: User,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.create(user.id, createPostDto);
  }

  /**
   * Get all posts with pagination and optional search.
   * GET /posts
   * Public endpoint - ordered by rankScore DESC, createdAt DESC.
   *
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 20, max: 100)
   * @param search - Optional search keyword for title/body
   * @returns Paginated posts with author information
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all posts (paginated, ranked, searchable)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-indexed)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (max 100)',
    example: 20,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search keyword for title/body',
    example: 'JWT',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated posts with metadata',
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    // Cap limit at 100
    const cappedLimit = Math.min(limit, 100);
    return this.postsService.findAll(page, cappedLimit, search);
  }

  /**
   * Get a single post by ID.
   * GET /posts/:id
   * Public endpoint - includes author information.
   *
   * @param id - Post ID
   * @returns Post with author
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns post with author information',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  /**
   * Update a post.
   * PUT /posts/:id
   * Protected endpoint - requires authentication and ownership.
   *
   * @param id - Post ID
   * @param user - Current authenticated user
   * @param updatePostDto - Updated post data
   * @returns Updated post
   */
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a post' })
  @ApiResponse({
    status: 200,
    description: 'Post updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not the post author',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, user.id, updatePostDto);
  }

  /**
   * Delete a post.
   * DELETE /posts/:id
   * Protected endpoint - requires authentication and ownership.
   *
   * @param id - Post ID
   * @param user - Current authenticated user
   */
  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({
    status: 204,
    description: 'Post deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not the post author',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postsService.delete(id, user.id);
  }
}

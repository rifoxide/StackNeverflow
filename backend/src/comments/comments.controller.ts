import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { Public } from '../common/decorators/public.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { User } from '../users/user.entity.js';

/**
 * Comments controller.
 * Exposes endpoints for creating and listing comments on a post.
 * Routes are nested under /posts/:postId/comments to keep the resource
 * relationship explicit in the URL.
 */
@ApiTags('Comments')
@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * Create a top-level comment or a reply (when parentCommentId is set).
   * POST /posts/:postId/comments
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a comment or reply on a post', description: '🔒 Requires authentication. Creates a top-level comment or reply to another comment.' })
  @ApiParam({ name: 'postId', description: 'Target post UUID', format: 'uuid' })
  @ApiBody({ type: CreateCommentDto, description: 'Comment content and optional parent comment ID for replies' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid parent comment or validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async create(
    @Param('postId') postId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(postId, user.id, dto);
  }

  /**
   * List all comments for a post (flat, ordered by createdAt ASC).
   * GET /posts/:postId/comments
   * Public — anyone can read comments.
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'List all comments for a post', description: '🌐 Public. Returns flat list of comments with author information, ordered by creation date.' })
  @ApiParam({ name: 'postId', description: 'Target post UUID', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Flat list of comments with author info and parent comment references',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findAll(@Param('postId') postId: string) {
    return this.commentsService.findAllForPost(postId);
  }
}

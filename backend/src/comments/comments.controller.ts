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
  @ApiOperation({ summary: 'Create a comment or reply on a post' })
  @ApiParam({ name: 'postId', description: 'Target post id', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Comment created' })
  @ApiResponse({ status: 400, description: 'Invalid parent comment' })
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
  @ApiOperation({ summary: 'List all comments for a post' })
  @ApiParam({ name: 'postId', description: 'Target post id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Flat list of comments with author info',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findAll(@Param('postId') postId: string) {
    return this.commentsService.findAllForPost(postId);
  }
}

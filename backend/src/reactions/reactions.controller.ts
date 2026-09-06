import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { ReactionsService } from './reactions.service.js';
import {
  ToggleReactionDto,
  REACTION_TARGET_TYPES,
} from './dto/toggle-reaction.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { User } from '../users/user.entity.js';
import type { ReactionTargetType } from './reaction.entity.js';

const TARGET_TYPE_VALUES: ReactionTargetType[] = ['post', 'comment'];

/**
 * Reactions controller.
 * Handles polymorphic like/dislike on posts and comments.
 */
@ApiTags('Reactions')
@Controller('reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  /**
   * Toggle a reaction (like/dislike) on a post or comment.
   * POST /reactions
   * Protected endpoint.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle a reaction on a post or comment', description: '🔒 Requires authentication. Adds, updates, or removes like/dislike reactions. Returns new state and counts.' })
  @ApiBody({ type: ToggleReactionDto, description: 'Reaction toggle payload (targetType, targetId, reactionType)' })
  @ApiResponse({ status: 200, description: 'Returns new reaction state (userReaction, likeCount, dislikeCount)' })
  @ApiResponse({ status: 400, description: 'Invalid payload or target type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Target post or comment not found' })
  async toggle(
    @CurrentUser() user: User,
    @Body() dto: ToggleReactionDto,
  ) {
    return this.reactionsService.toggle(user.id, dto);
  }

  /**
   * Get current user's reaction on a single target.
   * GET /reactions/me?targetType=post&targetId=...
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's reaction on a target", description: '🔒 Requires authentication. Returns user reaction (like/dislike/null) for a single post or comment.' })
  @ApiQuery({ name: 'targetType', enum: TARGET_TYPE_VALUES, description: 'Target type (post or comment)' })
  @ApiQuery({ name: 'targetId', format: 'uuid', description: 'Target UUID' })
  @ApiResponse({ status: 200, description: 'Returns reaction type (like/dislike) or null' })
  @ApiResponse({ status: 400, description: 'Invalid target type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMine(
    @CurrentUser() user: User,
    @Query('targetType') targetType: ReactionTargetType,
    @Query('targetId') targetId: string,
  ) {
    this.validateTargetType(targetType);
    const reaction = await this.reactionsService.getUserReaction(
      user.id,
      targetType,
      targetId,
    );
    return { reaction };
  }

  /**
   * Batch fetch current user's reactions for many targets.
   * GET /reactions/me/batch?targetType=post&targetIds=a,b,c
   * Returns a map of targetId -> reaction type (or null).
   */
  @Get('me/batch')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's reactions for many targets", description: '🔒 Requires authentication. Batch fetch reactions for multiple posts or comments (max 200).' })
  @ApiQuery({ name: 'targetType', enum: TARGET_TYPE_VALUES, description: 'Target type (post or comment)' })
  @ApiQuery({
    name: 'targetIds',
    description: 'Comma-separated target UUIDs (max 200)',
    example: 'id1,id2,id3',
  })
  @ApiResponse({ status: 200, description: 'Returns map of targetId -> reaction (like/dislike/null)' })
  @ApiResponse({ status: 400, description: 'Too many ids (max 200) or invalid target type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMineBatch(
    @CurrentUser() user: User,
    @Query('targetType') targetType: ReactionTargetType,
    @Query('targetIds') targetIdsParam: string,
  ) {
    this.validateTargetType(targetType);

    const targetIds = (targetIdsParam ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    return this.reactionsService.getUserReactionsBatch(
      user.id,
      targetType,
      targetIds,
    );
  }

  private validateTargetType(value: ReactionTargetType): void {
    if (!value || !REACTION_TARGET_TYPES.includes(value)) {
      throw new BadRequestException(
        `targetType must be one of: ${REACTION_TARGET_TYPES.join(', ')}`,
      );
    }
  }
}

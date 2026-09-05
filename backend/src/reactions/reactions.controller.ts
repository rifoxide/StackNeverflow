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
  @ApiOperation({ summary: 'Toggle a reaction on a post or comment' })
  @ApiResponse({ status: 200, description: 'Returns new state + counts' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Target not found' })
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
  @ApiOperation({ summary: "Get current user's reaction on a target" })
  @ApiQuery({ name: 'targetType', enum: TARGET_TYPE_VALUES })
  @ApiQuery({ name: 'targetId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Returns reaction type or null' })
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
  @ApiOperation({ summary: "Get current user's reactions for many targets" })
  @ApiQuery({ name: 'targetType', enum: TARGET_TYPE_VALUES })
  @ApiQuery({
    name: 'targetIds',
    description: 'Comma-separated target ids (max 200)',
    example: 'id1,id2,id3',
  })
  @ApiResponse({ status: 200, description: 'Returns map of targetId -> reaction' })
  @ApiResponse({ status: 400, description: 'Too many ids' })
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

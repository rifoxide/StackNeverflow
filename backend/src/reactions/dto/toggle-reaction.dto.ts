import { IsIn, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const REACTION_TARGET_TYPES = ['post', 'comment'] as const;
export const REACTION_TYPES = ['like', 'dislike'] as const;

/**
 * DTO for creating/toggling a reaction.
 * The toggle endpoint handles all three transitions:
 *   - no existing reaction → create
 *   - same type → remove (toggle off)
 *   - opposite type → switch
 */
export class ToggleReactionDto {
  @ApiProperty({
    description: 'Target type',
    enum: REACTION_TARGET_TYPES,
    example: 'post',
  })
  @IsIn(REACTION_TARGET_TYPES)
  targetType: 'post' | 'comment';

  @ApiProperty({
    description: 'Target id (post or comment uuid)',
    example: '9c8e2b34-3b1d-4f0e-9a5d-1f9c2a7b6c0e',
  })
  @IsNotEmpty()
  @IsUUID()
  targetId: string;

  @ApiProperty({
    description: 'Reaction type',
    enum: REACTION_TYPES,
    example: 'like',
  })
  @IsIn(REACTION_TYPES)
  type: 'like' | 'dislike';
}

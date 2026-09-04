import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating a new comment.
 * Top-level comment when parentCommentId is omitted; reply when provided.
 */
export class CreateCommentDto {
  @ApiProperty({
    description: 'Comment body (plain text, no markdown yet)',
    example: 'Great question — I had the same issue last week.',
    maxLength: 5000,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  body: string;

  @ApiProperty({
    description:
      'Optional parent comment id. Omit for top-level comment, set to comment id to reply.',
    example: '9c8e2b34-3b1d-4f0e-9a5d-1f9c2a7b6c0e',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}

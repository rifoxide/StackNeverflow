import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for updating a post.
 */
export class UpdatePostDto {
  @ApiProperty({
    description: 'Post title',
    example: 'How to implement JWT authentication in NestJS?',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({
    description: 'Post body (supports markdown)',
    example:
      'I am trying to implement JWT authentication but getting errors...',
    required: false,
  })
  @IsOptional()
  @IsString()
  body?: string;
}

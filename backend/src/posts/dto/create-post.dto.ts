import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating a new post.
 */
export class CreatePostDto {
  @ApiProperty({
    description: 'Post title',
    example: 'How to implement JWT authentication in NestJS?',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Post body (supports markdown)',
    example:
      'I am trying to implement JWT authentication but getting errors...',
  })
  @IsNotEmpty()
  @IsString()
  body: string;
}

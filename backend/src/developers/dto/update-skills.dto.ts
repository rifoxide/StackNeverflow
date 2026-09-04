import { IsArray, IsString, MaxLength, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for updating user's skills.
 * Replaces entire skills array (delete-then-insert in transaction).
 */
export class UpdateSkillsDto {
  @ApiProperty({
    description: 'Array of skill names',
    example: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
    type: [String],
    maxItems: 50,
  })
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  @ArrayMaxSize(50)
  skills: string[];
}

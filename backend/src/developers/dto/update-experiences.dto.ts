import {
  IsArray,
  IsString,
  MaxLength,
  IsDateString,
  IsOptional,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Single experience entry DTO.
 */
export class ExperienceDto {
  @ApiProperty({
    description: 'Job title',
    example: 'Senior Software Engineer',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Tech Corp',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  company: string;

  @ApiProperty({
    description: 'Start date (ISO 8601)',
    example: '2022-01-15',
  })
  @IsDateString()
  fromDate: string;

  @ApiProperty({
    description: 'End date (ISO 8601). Null if currently working.',
    example: '2024-05-30',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  toDate?: string | null;

  @ApiProperty({
    description: 'Job description',
    example: 'Led development of microservices architecture...',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;
}

/**
 * DTO for updating user's experiences.
 * Replaces entire experiences array (delete-then-insert in transaction).
 */
export class UpdateExperiencesDto {
  @ApiProperty({
    description: 'Array of work experiences',
    type: [ExperienceDto],
    maxItems: 20,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  @ArrayMaxSize(20)
  experiences: ExperienceDto[];
}

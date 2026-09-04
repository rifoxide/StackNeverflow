import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for user registration.
 * Validates input for POST /auth/register.
 */
export class RegisterDto {
  @ApiProperty({
    description: "User's display name",
    example: 'John Doe',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: "User's email address (must be unique)",
    example: 'john@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password (min 8 chars, max 72 chars for bcrypt)',
    example: 'SecurePass123',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72) // bcrypt max input length
  password: string;
}

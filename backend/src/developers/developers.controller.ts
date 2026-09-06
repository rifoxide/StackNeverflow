import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { extname } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { FastifyRequest } from 'fastify';
import { DevelopersService } from './developers.service.js';
import { UpdateSkillsDto } from './dto/update-skills.dto.js';
import { UpdateExperiencesDto } from './dto/update-experiences.dto.js';
import { Public } from '../common/decorators/public.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { User } from '../users/user.entity.js';

/**
 * Developers controller.
 * Manages developer profiles, skills, and work experiences.
 */
@ApiTags('Developers')
@Controller('developers')
export class DevelopersController {
  constructor(private readonly developersService: DevelopersService) {}

  /**
   * Get developer profile by ID.
   * GET /developers/:id
   * Public endpoint - anyone can view developer profiles.
   *
   * @param id - User ID
   * @returns Developer profile with skills and experiences
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get developer profile by ID', description: '🌐 Public. Fetches developer profile with skills and work experiences.' })
  @ApiParam({ name: 'id', description: 'User UUID', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Returns developer profile with skills and experiences',
  })
  @ApiResponse({
    status: 404,
    description: 'Developer not found',
  })
  async getDeveloperProfile(@Param('id') id: string) {
    return this.developersService.getDeveloperProfile(id);
  }

  /**
   * Get current user's profile.
   * GET /developers/me
   * Protected endpoint - returns authenticated user's profile.
   *
   * @param user - Current authenticated user
   * @returns Own developer profile with skills and experiences
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own developer profile', description: '🔒 Requires authentication. Returns own profile with skills and experiences.' })
  @ApiResponse({
    status: 200,
    description: 'Returns own profile with skills and experiences',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getMyProfile(@CurrentUser() user: User) {
    return this.developersService.getDeveloperProfile(user.id);
  }

  /**
   * Update current user's skills.
   * PUT /developers/me/skills
   * Replaces entire skills array (delete-then-insert in transaction).
   *
   * @param user - Current authenticated user
   * @param updateSkillsDto - New skills array
   * @returns Updated skills
   */
  @Put('me/skills')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own skills', description: '🔒 Requires authentication. Replaces entire skills array (transactional delete-then-insert).' })
  @ApiBody({ type: UpdateSkillsDto, description: 'Skills array (replaces existing)' })
  @ApiResponse({
    status: 200,
    description: 'Skills updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async updateMySkills(
    @CurrentUser() user: User,
    @Body() updateSkillsDto: UpdateSkillsDto,
  ) {
    return this.developersService.updateSkills(user.id, updateSkillsDto);
  }

  /**
   * Update current user's experiences.
   * PUT /developers/me/experiences
   * Replaces entire experiences array (delete-then-insert in transaction).
   *
   * @param user - Current authenticated user
   * @param updateExperiencesDto - New experiences array
   * @returns Updated experiences
   */
  @Put('me/experiences')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own work experiences', description: '🔒 Requires authentication. Replaces entire experiences array (transactional delete-then-insert).' })
  @ApiBody({ type: UpdateExperiencesDto, description: 'Experiences array (replaces existing)' })
  @ApiResponse({
    status: 200,
    description: 'Experiences updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async updateMyExperiences(
    @CurrentUser() user: User,
    @Body() updateExperiencesDto: UpdateExperiencesDto,
  ) {
    return this.developersService.updateExperiences(
      user.id,
      updateExperiencesDto,
    );
  }

  /**
   * Upload profile picture.
   * POST /developers/me/profile-picture
   * Accepts multipart/form-data with 'file' field.
   *
   * @param user - Current authenticated user
   * @param req - Fastify request with multipart data
   * @returns Updated user with new profile picture URL
   */
  @Post('me/profile-picture')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload profile picture', description: '🔒 Requires authentication. Accepts image files (JPEG, PNG, GIF, WEBP) up to 5MB.' })
  @ApiBody({
    description: 'Image file (max 5MB)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Profile picture image file',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile picture uploaded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type or size (max 5MB, allowed: JPEG, PNG, GIF, WEBP)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async uploadProfilePicture(
    @CurrentUser() user: User,
    @Req() req: FastifyRequest,
  ) {
    // Check if request is multipart
    if (!req.isMultipart()) {
      throw new BadRequestException('Request must be multipart/form-data');
    }

    try {
      // Get the file from the multipart request
      const data = await req.file();

      if (!data) {
        throw new BadRequestException('No file uploaded');
      }

      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(data.mimetype)) {
        throw new BadRequestException('Only image files (JPEG, PNG, GIF, WEBP) are allowed');
      }

      // Read file buffer
      const buffer = await data.toBuffer();

      // Validate file size (5MB)
      if (buffer.length > 5 * 1024 * 1024) {
        throw new BadRequestException('Image must be smaller than 5MB');
      }

      // Generate unique filename
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = extname(data.filename);
      const filename = `avatar-${uniqueSuffix}${ext}`;

      // Ensure uploads directory exists
      const uploadDir = join(process.cwd(), 'uploads', 'avatars');
      await mkdir(uploadDir, { recursive: true });

      // Write file to disk
      const filepath = join(uploadDir, filename);
      await writeFile(filepath, buffer);

      // Update user profile with new picture URL
      const profilePictureUrl = `/uploads/avatars/${filename}`;
      return this.developersService.updateProfilePicture(
        user.id,
        profilePictureUrl,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to upload file');
    }
  }
}

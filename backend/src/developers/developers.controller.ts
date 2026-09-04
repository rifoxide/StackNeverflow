import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Get developer profile by ID' })
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
  @ApiOperation({ summary: 'Get own developer profile' })
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
  @ApiOperation({ summary: 'Update own skills' })
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
  @ApiOperation({ summary: 'Update own work experiences' })
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
}

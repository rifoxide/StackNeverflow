import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/user.entity.js';
import { Skill } from '../users/skill.entity.js';
import { Experience } from '../users/experience.entity.js';
import { UpdateSkillsDto } from './dto/update-skills.dto.js';
import { UpdateExperiencesDto } from './dto/update-experiences.dto.js';

/**
 * Service for managing developer profiles.
 * Handles skills and work experiences CRUD operations.
 */
@Injectable()
export class DevelopersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get developer profile by ID.
   * Includes skills and experiences (eager loaded).
   *
   * @param id - User ID
   * @returns User with skills and experiences
   * @throws NotFoundException if user not found
   */
  async getDeveloperProfile(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        skills: true,
        experiences: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Developer with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Update user's skills.
   * Replaces entire skills array in a transaction (delete all, insert new).
   *
   * @param userId - User ID
   * @param updateSkillsDto - New skills array
   * @returns Updated skills
   */
  async updateSkills(
    userId: string,
    updateSkillsDto: UpdateSkillsDto,
  ): Promise<Skill[]> {
    return await this.dataSource.transaction(async (manager) => {
      // Delete existing skills
      await manager.delete(Skill, { userId });

      // Insert new skills
      if (updateSkillsDto.skills.length > 0) {
        const skillEntities = updateSkillsDto.skills.map((name) =>
          manager.create(Skill, { userId, name }),
        );
        return await manager.save(Skill, skillEntities);
      }

      return [];
    });
  }

  /**
   * Update user's experiences.
   * Replaces entire experiences array in a transaction (delete all, insert new).
   *
   * @param userId - User ID
   * @param updateExperiencesDto - New experiences array
   * @returns Updated experiences
   */
  async updateExperiences(
    userId: string,
    updateExperiencesDto: UpdateExperiencesDto,
  ): Promise<Experience[]> {
    return await this.dataSource.transaction(async (manager) => {
      // Delete existing experiences
      await manager.delete(Experience, { userId });

      // Insert new experiences
      if (updateExperiencesDto.experiences.length > 0) {
        const experienceEntities = updateExperiencesDto.experiences.map((exp) =>
          manager.create(Experience, {
            userId,
            title: exp.title,
            company: exp.company,
            fromDate: new Date(exp.fromDate),
            toDate: exp.toDate ? new Date(exp.toDate) : null,
            description: exp.description || null,
          }),
        );
        return await manager.save(Experience, experienceEntities);
      }

      return [];
    });
  }
}

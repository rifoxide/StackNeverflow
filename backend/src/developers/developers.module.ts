import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevelopersController } from './developers.controller.js';
import { DevelopersService } from './developers.service.js';
import { User } from '../users/user.entity.js';
import { Skill } from '../users/skill.entity.js';
import { Experience } from '../users/experience.entity.js';

/**
 * Developers module.
 * Manages developer profiles, skills, and work experiences (requirement B2).
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, Skill, Experience])],
  controllers: [DevelopersController],
  providers: [DevelopersService],
  exports: [DevelopersService],
})
export class DevelopersModule {}

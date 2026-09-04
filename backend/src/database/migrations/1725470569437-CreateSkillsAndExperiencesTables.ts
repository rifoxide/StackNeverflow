import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

/**
 * Migration: Create skills and experiences tables
 * Implements B2 requirement: Developer profiles with skills and work experience
 */
export class CreateSkillsAndExperiencesTables1725470569437
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create skills table
    await queryRunner.createTable(
      new Table({
        name: 'skills',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign key for skills.userId -> users.id
    await queryRunner.createForeignKey(
      'skills',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create experiences table
    await queryRunner.createTable(
      new Table({
        name: 'experiences',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'company',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'fromDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'toDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign key for experiences.userId -> users.id
    await queryRunner.createForeignKey(
      'experiences',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const skillsTable = await queryRunner.getTable('skills');
    const skillsForeignKey = skillsTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('userId') !== -1,
    );
    if (skillsForeignKey) {
      await queryRunner.dropForeignKey('skills', skillsForeignKey);
    }

    const experiencesTable = await queryRunner.getTable('experiences');
    const experiencesForeignKey = experiencesTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('userId') !== -1,
    );
    if (experiencesForeignKey) {
      await queryRunner.dropForeignKey('experiences', experiencesForeignKey);
    }

    // Drop tables
    await queryRunner.dropTable('experiences');
    await queryRunner.dropTable('skills');
  }
}

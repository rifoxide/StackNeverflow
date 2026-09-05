import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: Create reactions table
 * Implements B6 (polymorphic reactions on posts and comments).
 *
 * - targetType (post|comment) + targetId = polymorphic target reference
 * - UNIQUE (userId, targetType, targetId) = one reaction per user per target
 * - INDEX (targetType, targetId) for fast count lookups
 *
 * No FK on targetId: PostgreSQL does not support polymorphic FKs.
 * The service validates the target exists before writing.
 */
export class CreateReactionsTable1725472000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'reactions',
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
            name: 'targetType',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'targetId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // One reaction per (user, target)
    await queryRunner.createIndex(
      'reactions',
      new TableIndex({
        name: 'UQ_reactions_user_target',
        columnNames: ['userId', 'targetType', 'targetId'],
        isUnique: true,
      }),
    );

    // Fast lookups when counting reactions on a target
    await queryRunner.createIndex(
      'reactions',
      new TableIndex({
        name: 'IDX_reactions_target',
        columnNames: ['targetType', 'targetId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('reactions', 'IDX_reactions_target');
    await queryRunner.dropIndex('reactions', 'UQ_reactions_user_target');
    await queryRunner.dropTable('reactions');
  }
}

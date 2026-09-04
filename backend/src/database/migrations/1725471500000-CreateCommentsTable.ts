import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

/**
 * Migration: Create comments table
 * Implements B4 (comments) and B5 (replies / threading).
 *
 * - Self-referential parentCommentId for threading
 * - FK to posts and users (CASCADE delete)
 * - Indexes on postId and parentCommentId for fast lookups
 */
export class CreateCommentsTable1725471500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'comments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'postId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'authorId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'parentCommentId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'body',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'likesCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'dislikesCount',
            type: 'int',
            default: 0,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_comments_postId',
        columnNames: ['postId'],
      }),
    );

    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_comments_parentCommentId',
        columnNames: ['parentCommentId'],
      }),
    );

    // FK: comments.postId -> posts.id (CASCADE)
    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['postId'],
        referencedTableName: 'posts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // FK: comments.authorId -> users.id (CASCADE)
    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['authorId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // FK: comments.parentCommentId -> comments.id (CASCADE) — self-referential
    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['parentCommentId'],
        referencedTableName: 'comments',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('comments');
    if (table) {
      // Drop all FKs by column so order doesn't matter
      for (const fk of table.foreignKeys) {
        await queryRunner.dropForeignKey('comments', fk);
      }
    }

    await queryRunner.dropIndex('comments', 'IDX_comments_parentCommentId');
    await queryRunner.dropIndex('comments', 'IDX_comments_postId');
    await queryRunner.dropTable('comments');
  }
}

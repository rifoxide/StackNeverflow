import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePostsTable1725470980123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'posts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'authorId',
            type: 'uuid',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'body',
            type: 'text',
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
          {
            name: 'commentCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'rankScore',
            type: 'float',
            default: 0,
          },
        ],
      }),
      true,
    );

    // Create indexes for ranking and sorting
    await queryRunner.createIndex(
      'posts',
      new TableIndex({
        name: 'IDX_posts_rankScore',
        columnNames: ['rankScore'],
      }),
    );

    await queryRunner.createIndex(
      'posts',
      new TableIndex({
        name: 'IDX_posts_createdAt',
        columnNames: ['createdAt'],
      }),
    );

    // Create foreign key to users table
    await queryRunner.createForeignKey(
      'posts',
      new TableForeignKey({
        columnNames: ['authorId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('posts');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('authorId') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('posts', foreignKey);
      }
    }

    await queryRunner.dropIndex('posts', 'IDX_posts_createdAt');
    await queryRunner.dropIndex('posts', 'IDX_posts_rankScore');
    await queryRunner.dropTable('posts');
  }
}

import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class CreateNotificationsTable1788709813628 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type for notification types
        await queryRunner.query(`
            CREATE TYPE "notification_type_enum" AS ENUM (
                'post_reaction',
                'post_comment',
                'comment_reaction',
                'comment_reply'
            )
        `);

        // Create notifications table
        await queryRunner.createTable(
            new Table({
                name: 'notifications',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'type',
                        type: 'notification_type_enum',
                    },
                    {
                        name: 'recipientId',
                        type: 'uuid',
                    },
                    {
                        name: 'actorId',
                        type: 'uuid',
                    },
                    {
                        name: 'targetId',
                        type: 'uuid',
                    },
                    {
                        name: 'commentId',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'message',
                        type: 'text',
                    },
                    {
                        name: 'isRead',
                        type: 'boolean',
                        default: false,
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

        // Create index for efficient querying of user notifications
        await queryRunner.createIndex(
            'notifications',
            new TableIndex({
                name: 'IDX_notifications_recipient_read_created',
                columnNames: ['recipientId', 'isRead', 'createdAt'],
            }),
        );

        // Add foreign key constraints
        await queryRunner.createForeignKey(
            'notifications',
            new TableForeignKey({
                columnNames: ['recipientId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'notifications',
            new TableForeignKey({
                columnNames: ['actorId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        const table = await queryRunner.getTable('notifications');
        if (table) {
            const recipientForeignKey = table.foreignKeys.find(
                (fk) => fk.columnNames.indexOf('recipientId') !== -1,
            );
            const actorForeignKey = table.foreignKeys.find(
                (fk) => fk.columnNames.indexOf('actorId') !== -1,
            );

            if (recipientForeignKey) {
                await queryRunner.dropForeignKey('notifications', recipientForeignKey);
            }
            if (actorForeignKey) {
                await queryRunner.dropForeignKey('notifications', actorForeignKey);
            }
        }

        // Drop index
        await queryRunner.dropIndex('notifications', 'IDX_notifications_recipient_read_created');

        // Drop table
        await queryRunner.dropTable('notifications');

        // Drop enum type
        await queryRunner.query(`DROP TYPE "notification_type_enum"`);
    }

}

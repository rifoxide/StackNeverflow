import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial migration: Create users table.
 * Implements requirement B1: user authentication with password storage.
 *
 * Table structure:
 * - id: UUID primary key
 * - name: varchar(100) - user's display name
 * - email: varchar(255) - unique, used for login
 * - passwordHash: text - bcrypt hash (12 rounds)
 * - refreshTokenHash: text nullable - for refresh token rotation
 * - createdAt: timestamp
 * - updatedAt: timestamp
 */
export class CreateUsersTable1725464618000 implements MigrationInterface {
  name = 'CreateUsersTable1725464618000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "email" character varying(255) NOT NULL,
        "passwordHash" text NOT NULL,
        "refreshTokenHash" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    // Create index on email for faster lookups during login
    await queryRunner.query(`
      CREATE INDEX "IDX_users_email" ON "users" ("email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}

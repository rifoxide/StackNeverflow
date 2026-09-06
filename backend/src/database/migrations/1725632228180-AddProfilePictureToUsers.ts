import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfilePictureToUsers1725632228180 implements MigrationInterface {
  name = 'AddProfilePictureToUsers1725632228180';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "profilePicture" character varying(500)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "profilePicture"
    `);
  }
}

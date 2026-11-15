import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserActivityColumn1794551683337 implements MigrationInterface {
  name = 'AddUserActivityColumn1794551683337';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "activity" jsonb DEFAULT '{"isOnline": false, "lastActive": "1970-01-01T00:00:00.000Z"}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "activity" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "activity" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "activity"`);
  }
}

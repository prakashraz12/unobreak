import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserGeoDataStats1794581080448 implements MigrationInterface {
  name = 'AddUserGeoDataStats1794581080448';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "geoData" jsonb NOT NULL DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "stats" jsonb NOT NULL DEFAULT '{"totalMatches":0,"totalWins":0,"totalLosses":0}'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "stats"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "geoData"`);
  }
}

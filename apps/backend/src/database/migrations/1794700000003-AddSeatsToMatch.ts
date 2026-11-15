import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSeatsToMatch1794700000003 implements MigrationInterface {
  name = 'AddSeatsToMatch1794700000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "match" ADD "seats" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "match" DROP COLUMN "seats"`);
  }
}

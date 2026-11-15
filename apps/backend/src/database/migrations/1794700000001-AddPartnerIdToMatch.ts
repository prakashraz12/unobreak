import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPartnerIdToMatch1794700000001 implements MigrationInterface {
  name = 'AddPartnerIdToMatch1794700000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "match" ADD "partnerId" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "match" DROP COLUMN "partnerId"`);
  }
}

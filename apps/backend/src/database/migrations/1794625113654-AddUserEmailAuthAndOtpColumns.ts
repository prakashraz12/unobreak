import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserEmailAuthAndOtpColumns1794625113654 implements MigrationInterface {
  name = 'AddUserEmailAuthAndOtpColumns1794625113654';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "email" character varying(255) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "email" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "password" character varying(255) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "isEmailVerified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "customProfileImage" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "otp" character varying(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "otpExpiresAt" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "otpExpiresAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "otp"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "customProfileImage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "isEmailVerified"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
  }
}

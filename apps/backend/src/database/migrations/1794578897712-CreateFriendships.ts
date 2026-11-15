import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFriendships1794578897712 implements MigrationInterface {
  name = 'CreateFriendships1794578897712';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."friendships_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "friendships" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "status" "public"."friendships_status_enum" NOT NULL, "requesterId" integer, "addresseeId" integer, CONSTRAINT "UQ_ae267b922c295ac548dd498e540" UNIQUE ("requesterId", "addresseeId"), CONSTRAINT "PK_08af97d0be72942681757f07bc8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "friendships" ADD CONSTRAINT "FK_4f47ed519abe1ced044af260420" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "friendships" ADD CONSTRAINT "FK_c6ee540bba37d2b09b12dddd282" FOREIGN KEY ("addresseeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "friendships" DROP CONSTRAINT "FK_c6ee540bba37d2b09b12dddd282"`,
    );
    await queryRunner.query(
      `ALTER TABLE "friendships" DROP CONSTRAINT "FK_4f47ed519abe1ced044af260420"`,
    );
    await queryRunner.query(`DROP TABLE "friendships"`);
    await queryRunner.query(`DROP TYPE "public"."friendships_status_enum"`);
  }
}

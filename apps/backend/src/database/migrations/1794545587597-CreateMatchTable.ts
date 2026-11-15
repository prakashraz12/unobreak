import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMatchTable1794545587597 implements MigrationInterface {
  name = 'CreateMatchTable1794545587597';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."match_status_enum" AS ENUM('FINDING', 'JOINED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."match_type_enum" AS ENUM('SOLO', 'TEAM_2V2', 'PRIVATE_ROOM')`,
    );
    await queryRunner.query(
      `CREATE TABLE "match" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "status" "public"."match_status_enum" NOT NULL, "type" "public"."match_type_enum" NOT NULL, CONSTRAINT "PK_92b6c3a6631dd5b24a67c69f69d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "match_players_users" ("matchId" integer NOT NULL, "usersId" integer NOT NULL, CONSTRAINT "PK_05909c01c770ece2e3267522581" PRIMARY KEY ("matchId", "usersId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e30148cc4f65a99cd65ab657ee" ON "match_players_users"  ("matchId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e335b628bd746be3bd47434d8f" ON "match_players_users"  ("usersId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "match_players_users" ADD CONSTRAINT "FK_e30148cc4f65a99cd65ab657ee6" FOREIGN KEY ("matchId") REFERENCES "match"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "match_players_users" ADD CONSTRAINT "FK_e335b628bd746be3bd47434d8fc" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "match_players_users" DROP CONSTRAINT "FK_e335b628bd746be3bd47434d8fc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "match_players_users" DROP CONSTRAINT "FK_e30148cc4f65a99cd65ab657ee6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e335b628bd746be3bd47434d8f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e30148cc4f65a99cd65ab657ee"`,
    );
    await queryRunner.query(`DROP TABLE "match_players_users"`);
    await queryRunner.query(`DROP TABLE "match"`);
    await queryRunner.query(`DROP TYPE "public"."match_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."match_status_enum"`);
  }
}

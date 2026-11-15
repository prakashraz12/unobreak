import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGameSessionTables1794570956905 implements MigrationInterface {
  name = 'CreateGameSessionTables1794570956905';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."game_sessions_status_enum" AS ENUM('ACTIVE', 'FINISHED', 'ABANDONED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "game_sessions" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "status" "public"."game_sessions_status_enum" NOT NULL, "seed" integer NOT NULL, "state" jsonb NOT NULL, "finishedAt" TIMESTAMP WITH TIME ZONE, "matchId" integer, "winnerId" integer, CONSTRAINT "PK_e25fa82d55744e55000c3288fdc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "game_session_players" ("id" SERIAL NOT NULL, "seat" integer NOT NULL, "placement" integer, "leftAt" TIMESTAMP WITH TIME ZONE, "sessionId" integer, "userId" integer, CONSTRAINT "UQ_9b98960866b161fc7ad843b492a" UNIQUE ("sessionId", "seat"), CONSTRAINT "UQ_952cb093c277dc6c16772353d19" UNIQUE ("sessionId", "userId"), CONSTRAINT "PK_5cff2279a247b7a64fb02ae5dd4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_sessions" ADD CONSTRAINT "FK_e410ab8cbaac4efb0d7cff95a21" FOREIGN KEY ("matchId") REFERENCES "match"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_sessions" ADD CONSTRAINT "FK_05fc1fa1e3c6d734c07ea753aa6" FOREIGN KEY ("winnerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_session_players" ADD CONSTRAINT "FK_8b3f3c2b49d1980bbcd8553c64c" FOREIGN KEY ("sessionId") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_session_players" ADD CONSTRAINT "FK_15881e6a1d44b1593164f0eb29b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "game_session_players" DROP CONSTRAINT "FK_15881e6a1d44b1593164f0eb29b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_session_players" DROP CONSTRAINT "FK_8b3f3c2b49d1980bbcd8553c64c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_sessions" DROP CONSTRAINT "FK_05fc1fa1e3c6d734c07ea753aa6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_sessions" DROP CONSTRAINT "FK_e410ab8cbaac4efb0d7cff95a21"`,
    );
    await queryRunner.query(`DROP TABLE "game_session_players"`);
    await queryRunner.query(`DROP TABLE "game_sessions"`);
    await queryRunner.query(`DROP TYPE "public"."game_sessions_status_enum"`);
  }
}

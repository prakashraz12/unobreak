import { MigrationInterface, QueryRunner } from 'typeorm';

export class MatchmakingHardening1794700000004 implements MigrationInterface {
  name = 'MatchmakingHardening1794700000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "match" ADD "expiresAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "match" ADD "requestId" character varying`,
    );
    // One live session per match — concurrent match:start races lose at
    // the index instead of spawning duplicate games.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_game_sessions_active_match" ON "game_sessions" ("matchId") WHERE "status" = 'ACTIVE'`,
    );
    // Idempotent ticket creation: retries reuse the original row.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_match_requestId" ON "match" ("requestId") WHERE "requestId" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_match_status" ON "match" ("status") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_match_status"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_match_requestId"`);
    await queryRunner.query(
      `DROP INDEX "public"."UQ_game_sessions_active_match"`,
    );
    await queryRunner.query(`ALTER TABLE "match" DROP COLUMN "requestId"`);
    await queryRunner.query(`ALTER TABLE "match" DROP COLUMN "expiresAt"`);
  }
}

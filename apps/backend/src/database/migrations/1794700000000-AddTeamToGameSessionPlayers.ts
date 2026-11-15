import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTeamToGameSessionPlayers1794700000000 implements MigrationInterface {
  name = 'AddTeamToGameSessionPlayers1794700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "game_session_players" ADD "team" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "game_session_players" DROP COLUMN "team"`,
    );
  }
}

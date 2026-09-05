import { MigrationInterface, QueryRunner } from 'typeorm';
import { applyPlatformTables } from '../tenant/tenant-ddl';

export class PlatformPreloginToken1700000000005 implements MigrationInterface {
  name = 'PlatformPreloginToken1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await applyPlatformTables(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS public."platform_prelogin_token" CASCADE`,
    );
  }
}

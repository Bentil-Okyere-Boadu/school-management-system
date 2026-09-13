import { MigrationInterface, QueryRunner } from 'typeorm';
import { applyPlatformTables } from '../tenant/tenant-ddl';

export class PlatformCatalog1700000000001 implements MigrationInterface {
  name = 'PlatformCatalog1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await applyPlatformTables(queryRunner);
    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.school
        ADD COLUMN IF NOT EXISTS "schemaName" varchar,
        ADD COLUMN IF NOT EXISTS "provisioningStatus" varchar DEFAULT 'not_provisioned',
        ADD COLUMN IF NOT EXISTS "provisionedAt" timestamptz,
        ADD COLUMN IF NOT EXISTS "lastProvisionError" text,
        ADD COLUMN IF NOT EXISTS "isDisabled" boolean DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.refresh_token
        ADD COLUMN IF NOT EXISTS "schoolId" uuid
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE IF EXISTS public.refresh_token DROP COLUMN IF EXISTS "schoolId"`,
    );
  }
}

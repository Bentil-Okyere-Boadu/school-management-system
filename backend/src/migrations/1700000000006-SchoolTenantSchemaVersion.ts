import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchoolTenantSchemaVersion1700000000006 implements MigrationInterface {
  name = 'SchoolTenantSchemaVersion1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.school
        ADD COLUMN IF NOT EXISTS "tenantSchemaVersion" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "tenantMigrationStatus" varchar NOT NULL DEFAULT 'ok',
        ADD COLUMN IF NOT EXISTS "lastTenantMigrationError" text,
        ADD COLUMN IF NOT EXISTS "lastTenantMigrationAt" timestamptz
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.school
        DROP COLUMN IF EXISTS "lastTenantMigrationAt",
        DROP COLUMN IF EXISTS "lastTenantMigrationError",
        DROP COLUMN IF EXISTS "tenantMigrationStatus",
        DROP COLUMN IF EXISTS "tenantSchemaVersion"
    `);
  }
}

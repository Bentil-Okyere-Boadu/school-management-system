import { DataSource, QueryRunner } from 'typeorm';
import { applyPlatformTables } from '../../src/tenant/tenant-ddl';

export async function ensurePlatformSchoolCatalog(
  queryRunner: QueryRunner,
): Promise<void> {
  await applyPlatformTables(queryRunner);
  await queryRunner.query(`
    ALTER TABLE IF EXISTS public.school
      ADD COLUMN IF NOT EXISTS "schemaName" varchar,
      ADD COLUMN IF NOT EXISTS "provisioningStatus" varchar DEFAULT 'not_provisioned',
      ADD COLUMN IF NOT EXISTS "provisionedAt" timestamptz,
      ADD COLUMN IF NOT EXISTS "lastProvisionError" text,
      ADD COLUMN IF NOT EXISTS "isDisabled" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "tenantSchemaVersion" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "tenantMigrationStatus" varchar NOT NULL DEFAULT 'ok',
      ADD COLUMN IF NOT EXISTS "lastTenantMigrationError" text,
      ADD COLUMN IF NOT EXISTS "lastTenantMigrationAt" timestamptz
  `);
}

export async function bootstrapTenantE2eDataSource(
  ds: DataSource,
): Promise<void> {
  const qr = ds.createQueryRunner();
  await qr.connect();
  try {
    await ensurePlatformSchoolCatalog(qr);
  } finally {
    await qr.release();
  }
}

import { QueryRunner } from 'typeorm';
import { TenantMigrationStep } from '../tenant/tenant-migration.types';

export const version = 0;
export const name = 'register-pre-lifecycle-baseline';

/** No-op marker: existing tenants at pre-lifecycle shape are version 0. */
export async function up(
  _queryRunner: QueryRunner,
  _schemaName: string,
): Promise<void> {
  // Intentionally empty — catalog default tenantSchemaVersion=0 covers baseline.
}

export const baselineStep: TenantMigrationStep = {
  version,
  name,
  up,
};

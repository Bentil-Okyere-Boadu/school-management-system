import { QueryRunner } from 'typeorm';
import { quotePgIdent } from '../../../src/tenant/tenant-schema.util';
import { TenantMigrationStep } from '../../../src/tenant/tenant-migration.types';

export const version = 901;
export const name = 'add-test-column';

export async function up(
  queryRunner: QueryRunner,
  schemaName: string,
): Promise<void> {
  await queryRunner.query(
    `ALTER TABLE ${quotePgIdent(schemaName)}.student ADD COLUMN IF NOT EXISTS "_lifecycleTestCol" varchar`,
  );
}

export const addTestColumnStep: TenantMigrationStep = {
  version,
  name,
  up,
};

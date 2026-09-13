import { QueryRunner } from 'typeorm';
import { quotePgIdent } from '../../../src/tenant/tenant-schema.util';
import { TenantMigrationStep } from '../../../src/tenant/tenant-migration.types';

export const version = 903;
export const name = 'add-test-index';

export async function up(
  queryRunner: QueryRunner,
  schemaName: string,
): Promise<void> {
  await queryRunner.query(
    `CREATE INDEX IF NOT EXISTS "_lifecycle_test_col_idx"
     ON ${quotePgIdent(schemaName)}.student ("_lifecycleTestCol")`,
  );
}

export const addTestIndexStep: TenantMigrationStep = {
  version,
  name,
  up,
};

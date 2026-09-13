import { QueryRunner } from 'typeorm';
import { quotePgIdent } from '../../../src/tenant/tenant-schema.util';
import { TenantMigrationStep } from '../../../src/tenant/tenant-migration.types';

export const version = 902;
export const name = 'add-test-table';

export async function up(
  queryRunner: QueryRunner,
  schemaName: string,
): Promise<void> {
  await queryRunner.query(
    `CREATE TABLE IF NOT EXISTS ${quotePgIdent(schemaName)}."_lifecycle_test_table" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      note varchar
    )`,
  );
}

export const addTestTableStep: TenantMigrationStep = {
  version,
  name,
  up,
};

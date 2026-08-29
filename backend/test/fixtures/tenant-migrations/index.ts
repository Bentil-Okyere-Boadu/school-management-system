import { addTestColumnStep } from './901-add-test-column';
import { addTestTableStep } from './902-add-test-table';
import { addTestIndexStep } from './903-add-test-index';
import { TenantMigrationStep } from '../../../src/tenant/tenant-migration.types';

export const TEST_TENANT_MIGRATIONS: TenantMigrationStep[] = [
  addTestColumnStep,
  addTestTableStep,
  addTestIndexStep,
];

export const TEST_TENANT_SCHEMA_HEAD = 903;

export function buildTestTenantRegistry(
  productionSteps: TenantMigrationStep[],
): TenantMigrationStep[] {
  return [...productionSteps, ...TEST_TENANT_MIGRATIONS];
}

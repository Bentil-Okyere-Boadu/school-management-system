import { TenantMigrationStep } from './tenant-migration.types';
import { PRODUCTION_TENANT_MIGRATIONS } from '../tenant-migrations';

function validateRegistry(steps: TenantMigrationStep[]): TenantMigrationStep[] {
  const sorted = [...steps].sort((a, b) => a.version - b.version);
  const seen = new Set<number>();
  for (const step of sorted) {
    if (seen.has(step.version)) {
      throw new Error(
        `Duplicate tenant migration version ${step.version} (${step.name})`,
      );
    }
    seen.add(step.version);
  }
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].version <= sorted[i - 1].version) {
      throw new Error(
        `Tenant migration versions must be strictly increasing: ${sorted[i - 1].version} then ${sorted[i].version}`,
      );
    }
  }
  return sorted;
}

export function loadProductionRegistry(): TenantMigrationStep[] {
  return validateRegistry(PRODUCTION_TENANT_MIGRATIONS);
}

export function loadRegistry(
  override?: TenantMigrationStep[],
): TenantMigrationStep[] {
  if (override?.length) {
    return validateRegistry(override);
  }
  return loadProductionRegistry();
}

export function stepsForRange(
  steps: TenantMigrationStep[],
  fromExclusive: number,
  toInclusive: number,
): TenantMigrationStep[] {
  return steps.filter(
    (step) => step.version > fromExclusive && step.version <= toInclusive,
  );
}

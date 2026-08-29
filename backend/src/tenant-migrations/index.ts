import { baselineStep } from './000-baseline';
import { TenantMigrationStep } from '../tenant/tenant-migration.types';

export const PRODUCTION_TENANT_MIGRATIONS: TenantMigrationStep[] = [baselineStep];

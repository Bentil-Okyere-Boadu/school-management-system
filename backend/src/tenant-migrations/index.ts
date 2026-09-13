import { baselineStep } from './000-baseline';
import { parentInvitationExpiredNotifiedAtStep } from './001-parent-invitation-expired-notified-at';
import { TenantMigrationStep } from '../tenant/tenant-migration.types';

export const PRODUCTION_TENANT_MIGRATIONS: TenantMigrationStep[] = [
  baselineStep,
  parentInvitationExpiredNotifiedAtStep,
];

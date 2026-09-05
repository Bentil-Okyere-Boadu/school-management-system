import { QueryRunner } from 'typeorm';

export interface TenantMigrationStep {
  version: number;
  name: string;
  up(queryRunner: QueryRunner, schemaName: string): Promise<void>;
}

export interface TenantMigrationSummary {
  head: number;
  ok: number;
  failed: number;
  skipped: number;
  failures: Array<{ schoolId: string; error: string }>;
}

export interface TenantMigrationOptions {
  /** Override schema head (E2E / tests only). */
  head?: number;
  /** Override migration registry (E2E / tests only). */
  steps?: TenantMigrationStep[];
  /** When true, skip advisory lock (unit tests only). */
  skipAdvisoryLock?: boolean;
}

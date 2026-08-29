/**
 * Latest tenant schema version for production deployments.
 * Bump when adding a new step under src/tenant-migrations/.
 */
export const TENANT_SCHEMA_HEAD = 0;

/** PostgreSQL advisory lock id for single-run tenant migration (64-bit safe int). */
export const TENANT_MIGRATION_ADVISORY_LOCK_ID = 610947231;

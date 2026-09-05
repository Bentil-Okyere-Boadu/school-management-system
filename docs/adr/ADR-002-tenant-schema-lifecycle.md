# ADR-002: Tenant schema lifecycle and per-tenant migrations

**Status:** Accepted (Phase 6 — implemented 2026-08-29)  
**Date:** 2026-08-29  
**Related:** [ADR-001: Schema-per-school tenancy](./ADR-001-schema-per-school-tenancy.md)  
**Developer guide:** [tenant-schema-migrations.md](../tenant-schema-migrations.md)

## Context

ADR-001 established schema-per-school tenancy: operational data lives in `tenant_<school-uuid>` schemas; the `public` schema holds the platform catalog only.

Platform TypeORM migrations under `backend/src/migrations/` apply to catalog tables only and do **not** upgrade existing tenant schemas. New schools received the latest tenant DDL at provisioning time via [`applyTenantSchemaTables`](../../backend/src/tenant/tenant-ddl.ts), but existing active tenants had no versioned upgrade path when entity metadata changed.

Phase 6 closes this gap with a hybrid approach that preserves ADR-001 isolation, provisioning flow, and platform migration discipline.

## Decision

**Hybrid D — platform migrations unchanged + tenant-aware incremental migration runner**

### Platform layer (`public`)

- Existing TypeORM migrations continue unchanged (`migrationsRun: true` on app boot).
- Migration `SchoolTenantSchemaVersion1700000000006` adds per-school tracking on `public.school`:
  - `tenantSchemaVersion` (int, default `0`)
  - `tenantMigrationStatus` (`ok` \| `pending` \| `failed`)
  - `lastTenantMigrationError`, `lastTenantMigrationAt`

### Tenant layer (per schema)

- Incremental steps live in `backend/src/tenant-migrations/` as plain TS modules implementing `TenantMigrationStep` — **not** TypeORM `MigrationInterface`.
- [`TenantSchemaMigrator`](../../backend/src/tenant/tenant-schema-migrator.service.ts) discovers active schools and runs pending steps per schema using a **dedicated `QueryRunner`** with `SET LOCAL search_path`.
- The migrator does **not** use `TenantConnectionService`, HTTP ALS, or `TenantRequestInterceptor`.
- Production registry is ordered by numeric `version`; duplicate versions fail at load time.
- `TENANT_SCHEMA_HEAD` in code defines the expected version for the current release.

### New school path

1. [`TenantProvisionerService`](../../backend/src/tenant/tenant-provisioner.service.ts) creates schema + baseline DDL + seeds (unchanged).
2. [`TenantSchemaInspector`](../../backend/src/tenant/tenant-schema-inspector.service.ts) verifies live schema matches entity metadata at `TENANT_SCHEMA_HEAD`.
3. Only on success: `tenantSchemaVersion = TENANT_SCHEMA_HEAD`, `tenantMigrationStatus = ok`.
4. A school is **never** marked HEAD unless its actual schema matches HEAD.

New schools do not replay incrementals if baseline DDL is kept current.

### Existing school upgrade path

Deploy order (all environments):

1. Platform migrations
2. `npm run tenant:migrate` (explicit CLI — **not** on HTTP requests or app startup)
3. Fail deploy/CI if any active tenant failed

Per-tenant transaction: tenant A can succeed while tenant B fails; B retains its previous version with `failed` status. Retries are safe via idempotent steps (`IF NOT EXISTS`).

### Concurrency control

- PostgreSQL advisory lock (`pg_try_advisory_lock`) at migrator start prevents multiple deploy instances from migrating tenants concurrently.
- Run as a single release job on Render/multi-instance deployments.

## Alternatives rejected

| Option | Verdict | Reason |
|--------|---------|--------|
| Re-run `applyTenantSchemaTables` on deploy | Reject | `IF NOT EXISTS` skips existing tables; no column heals |
| TypeORM migrations per tenant | Reject | Single global `migrationsRun`; fights platform-only migration culture |
| `synchronize: true` | Reject | Violates ADR-001 safety |
| HTTP-triggered migration as primary path | Reject | Must not run in request path |
| Schema diff auto-migration | Reject | High risk for renames/constraints; hard to review |

## Consequences

- Shipping a tenant entity change requires both baseline entity metadata **and** an incremental tenant migration for existing schools.
- Developers bump `TENANT_SCHEMA_HEAD` and register steps under `tenant-migrations/`.
- Deploy pipelines must include `tenant:migrate` after platform migrations.
- Failed tenants are observable via catalog fields; re-run `tenant:migrate` after fixing root cause.
- E2E proof: `npm run test:tenant-lifecycle` (9 tests covering upgrade, skip, failure isolation, retry, and schema equivalence).

## Validation

Local Phase 6 gate (2026-08-29):

- `npm run test:tenant-proof` — PASS (17 tests)
- `npm run test:tenant-lifecycle` — PASS (9 tests)
- `npm run tenant:migrate` — PASS

See [Phase 5/6 validation log](../phase-5-validation-log.md).

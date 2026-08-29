# ADR-002: Tenant schema lifecycle and per-tenant migrations

**Status:** Proposed (Phase 4.7 — future architectural follow-up)  
**Date:** 2026-08-29  
**Related:** [ADR-001: Schema-per-school tenancy](./ADR-001-schema-per-school-tenancy.md)

## Context

ADR-001 established schema-per-school tenancy: operational data lives in `tenant_<school-uuid>` schemas; the `public` schema holds the platform catalog only.

Phase 4 cutover removed shared `public` operational tables. Platform migrations under `backend/src/migrations/` apply to catalog tables (e.g. `tenant_directory`, `platform_invitation`, `platform_prelogin_token`) and do **not** upgrade existing tenant schemas.

## What the current architecture supports

Today, **new schools receive the latest tenant schema at provisioning time**:

1. Super Admin creates a school → `public.school` catalog row (`provisioning` → `active`).
2. [`TenantProvisionerService`](../../backend/src/tenant/tenant-provisioner.service.ts) runs for that school.
3. Postgres schema `tenant_<school-uuid>` is created ([`tenantSchemaName`](../../backend/src/tenant/tenant-schema.util.ts)).
4. [`applyTenantSchemaTables`](../../backend/src/tenant/tenant-ddl.ts) creates tenant DDL from **current** TypeORM entity metadata.
5. Default seeds (event categories, grading) are written into that schema only.
6. School is marked `active` when provisioning completes.

**New schools therefore always start on the schema shape defined by the code at provision time.**

## Known gap

There is **no dedicated per-tenant schema migration mechanism** for schools that already exist.

Example:

```
tenant_A   tenant_B   tenant_C   (existing active schools)
        ↓
Developer adds a new tenant column or table in entity metadata
        ↓
New school tenant_D provisions with the new DDL automatically
        ↓
tenant_A / tenant_B / tenant_C do NOT receive the change automatically
        ↓
Current implementation has no versioned upgrade path for existing tenants
```

This is a **conscious architectural follow-up (Phase 4.7)**, documented during Phase 5 validation. It is not an accidental omission.

## Future requirements (Phase 4.7 — not designed or implemented)

When Phase 4.7 is scheduled, the migration framework must satisfy at least:

1. **Versioning** — tenant schema changes must be versioned (explicit schema revision identity).
2. **New schools** — must continue to receive the latest schema at provisioning time (preserve current provisioner behavior).
3. **Existing schools** — active tenants must be upgraded when tenant DDL changes ship.
4. **Failure handling** — a failed tenant migration must not silently leave a school in an inconsistent state; failures must be observable and recoverable.
5. **Per-school tracking** — migration status and/or schema version should be recordable per school (catalog or companion table).
6. **Deploy verification** — deployments should be able to determine whether every active tenant is on the expected schema version before or after rollout.
7. **Architecture fit** — the solution must work with schema-per-school tenancy and must **not** recreate shared `public` operational tables.

## Decision (proposed — deferred)

**No migration framework is designed or implemented in Phase 5.**

Phase 4.7 will produce a revised ADR (or ADR-002 status change to Accepted) with a concrete approach — e.g. versioned DDL scripts applied per schema via a tenant migrator service, integrated with provisioning status and deploy health checks.

Until then:

- **Platform migrations** → `public` catalog only (existing TypeORM migration runner).
- **New tenant DDL** → provisioner at school create time only.
- **Existing tenants** → require manual intervention or a future Phase 4.7 tool; do not assume auto-upgrade on deploy.

## Consequences

- Shipping a tenant entity change affects **new** schools immediately and **existing** schools only after Phase 4.7 is implemented (or via a one-off operational script outside the product path).
- Phase 5 validation covers provisioning, platform migrations, and tenancy isolation — not per-tenant schema upgrade automation.
- See [Phase 5 validation log](../phase-5-validation-log.md) for explicit deferral at sign-off time.

## Options to evaluate in Phase 4.7 (not decided)

- Sequential `forEachActiveSchool` migrator with idempotent DDL steps and per-school status on `public.school`.
- Flyway/Liquibase-style version table per tenant schema.
- Generated diff from entity metadata vs live schema (higher risk; needs careful review).
- Blue/green schema swap per tenant (complex; likely overkill initially).

These are exploration notes only. Phase 4.7 will select and document one approach.

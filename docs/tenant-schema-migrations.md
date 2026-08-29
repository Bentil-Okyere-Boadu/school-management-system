# Tenant schema migrations

Per-school tenant DDL is versioned separately from platform (`public`) TypeORM migrations. This document covers developer workflow, deploy order, and troubleshooting.

**Related:** [ADR-002](./adr/ADR-002-tenant-schema-lifecycle.md), [ADR-001](./adr/ADR-001-schema-per-school-tenancy.md)

---

## Architecture summary

| Layer | Location | When it runs |
|-------|----------|--------------|
| Platform migrations | `backend/src/migrations/` | App boot (`migrationsRun: true`) or deploy job |
| Tenant baseline (new schools) | `TenantProvisionerService` + `applyTenantSchemaTables` | School create / provision |
| Tenant incrementals (existing schools) | `backend/src/tenant-migrations/` | Explicit `npm run tenant:migrate` only |

Tenant migrations use plain TS modules (`TenantMigrationStep`), **not** TypeORM `MigrationInterface`. The migrator uses a dedicated `QueryRunner` per schema with `SET LOCAL search_path` — never HTTP ALS, `TenantRequestInterceptor`, or `TenantConnectionService`.

---

## Catalog fields (`public.school`)

| Column | Purpose |
|--------|---------|
| `tenantSchemaVersion` | Applied tenant schema version (integer, default `0`) |
| `tenantMigrationStatus` | `ok` \| `pending` \| `failed` |
| `lastTenantMigrationError` | Failure detail for ops |
| `lastTenantMigrationAt` | Last migration attempt timestamp |

Production HEAD is defined in code: `TENANT_SCHEMA_HEAD` in `backend/src/tenant/tenant-schema-version.ts`.

---

## Local developer workflow

1. Start Postgres: `npm run db:up` (from `backend/`)
2. Pull latest code with entity / migration changes
3. Platform migrations apply on app boot, or run the app once with `migrationsRun: true`
4. Run tenant migrations explicitly:

```bash
cd backend
npm run tenant:migrate
```

5. Verify:

```sql
SELECT id, name, "tenantSchemaVersion", "tenantMigrationStatus", "lastTenantMigrationError"
FROM public.school
WHERE "provisioningStatus" = 'active';
```

6. Run automated gates:

```bash
npm run test:tenant-proof
npm run test:tenant-lifecycle
```

---

## Adding a tenant schema change

When you change tenant entity metadata (`TENANT_ENTITIES`):

1. Update the TypeORM entity(ies) as usual.
2. Confirm `applyTenantSchemaTables` on an empty schema creates the new shape (entity metadata drives baseline for **new** schools).
3. Add an incremental step under `backend/src/tenant-migrations/`:

```
backend/src/tenant-migrations/
  000-baseline.ts          # pre-lifecycle marker (no-op)
  001-your-change.ts       # next version
  index.ts                 # register in PRODUCTION_TENANT_MIGRATIONS
```

Example step:

```typescript
export const version = 1;
export const name = 'add-student-lifecycle-note';

export async function up(qr: QueryRunner, schemaName: string): Promise<void> {
  await qr.query(
    `ALTER TABLE ${quotePgIdent(schemaName)}.student ADD COLUMN IF NOT EXISTS "lifecycleNote" varchar`,
  );
}
```

4. Bump `TENANT_SCHEMA_HEAD` in `tenant-schema-version.ts`.
5. Register the step in `tenant-migrations/index.ts` (versions must be unique and strictly increasing).
6. Run locally: platform migrate + `npm run tenant:migrate`.
7. Add/adjust E2E coverage if behavior is non-trivial.

**Do not** add tenant DDL to `backend/src/migrations/` (platform catalog only).

---

## Deploy order (LOCAL → DEV → TEST/RENDER)

All environments use the same sequence:

1. **Platform migrations** — app boot with `migrationsRun: true`, or a dedicated migration job
2. **`npm run tenant:migrate`** — one-off release job (not per-instance startup)
3. **Fail deploy** if `tenant:migrate` exits non-zero

### Render / multi-instance

- Run `tenant:migrate` as a **single release job** before shifting traffic.
- The migrator acquires a PostgreSQL advisory lock (`pg_try_advisory_lock`) so concurrent deploy instances cannot migrate tenants in parallel.
- Exit code `2` = another migrator holds the lock.

---

## Failure handling

If tenant A succeeds and tenant B fails:

- A remains upgraded (`tenantSchemaVersion = HEAD`, `tenantMigrationStatus = ok`)
- B stays at its previous version with `tenantMigrationStatus = failed` and `lastTenantMigrationError` set
- The overall CLI exits `1`; CI/deploy should fail

**Retry:** Fix the underlying issue, then re-run `npm run tenant:migrate`. Idempotent steps (`IF NOT EXISTS`) make retries safe.

**Query failed tenants:**

```sql
SELECT id, name, "tenantSchemaVersion", "tenantMigrationStatus", "lastTenantMigrationError"
FROM public.school
WHERE "provisioningStatus" = 'active'
  AND "tenantMigrationStatus" = 'failed';
```

---

## New school provisioning

New schools receive the full baseline via `applyTenantSchemaTables`. Before marking `tenantSchemaVersion = TENANT_SCHEMA_HEAD`, `TenantSchemaInspector` verifies the live schema matches entity metadata. A mismatch fails provisioning — a school is never marked HEAD unless its schema actually matches HEAD.

New schools do **not** replay incrementals 001..N if the baseline DDL is kept current.

---

## Testing

| Script | Purpose |
|--------|---------|
| `npm run test:tenant-proof` | Regression tenancy suites (Phase 0–5 + pre-login) |
| `npm run test:tenant-lifecycle` | Phase 6 lifecycle matrix (upgrade, skip, failure isolation, retry, schema equivalence) |

Test-only migration steps live under `backend/test/fixtures/tenant-migrations/` (versions 901–903). They are **not** in the production registry.

---

## What tenant migrations never do

- Run on HTTP requests or app startup by default
- Use `TenantConnectionService` or request-scoped ALS
- Create or alter `public` operational tenant tables (`student`, `teacher`, etc. in `public`)
- Register as TypeORM platform migrations

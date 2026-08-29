# ADR-001: Schema-per-school tenancy

**Status:** Accepted (Phase 5 local validation: 2026-08-29)
**Date:** 2026-08-29

## Context

The prototype stored every school in one Postgres `public` schema and isolated rows with `schoolId` filters. That is leak-prone and does not match a production multi-tenant school product.

There are no production clients or data to preserve.

## Decision

One Postgres database:

- `public` is the platform catalog (schools, invitations, tenant directory, super admins, roles, refresh tokens).
- Each school gets schema `tenant_<uuid>` with operational tables only (no `school` or `role` table in the tenant schema).
- JWT carries `schoolId`. `schemaName` is resolved only from `public.school`.
- Tenant work uses one request-scoped QueryRunner, a transaction, and `SET LOCAL search_path TO "<schema>", public`.
- Never create a TypeORM DataSource per school.
- Provisioning: catalog row → `CREATE SCHEMA` → tenant DDL → seeds → `active`. Failures stay `failed` and retryable.
- Super Admin creates the school; invitations live in public; SchoolAdmin is created in the tenant schema on accept.

## Options considered

Shared `schoolId` filters (rejected), database-per-school (rejected: ops cost), schema-per-school (accepted).

## Consequences

- Super Admin must not load tenant graphs via `School.students`.
- Prototype filters, `TenantScopedRepositoryService`, and admin `POST /schools/create` are removed, not wrapped.
- Phase 0a proved TypeORM hydrates `public.school` under `SET LOCAL search_path` with unqualified `"school"` joins and tenant→public FKs.
- **Existing-tenant DDL lifecycle:** new schools receive current schema via the provisioner; upgrading already-active tenant schemas when entity metadata changes is **not** implemented. See [ADR-002: Tenant schema lifecycle](./ADR-002-tenant-schema-lifecycle.md) (Phase 4.7 follow-up).
- **Phase 5 local validation:** completed 2026-08-29 (see [phase-5-validation-log.md](../phase-5-validation-log.md)).

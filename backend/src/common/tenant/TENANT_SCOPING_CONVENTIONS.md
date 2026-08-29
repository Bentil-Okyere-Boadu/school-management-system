# Tenant data access

Isolation is PostgreSQL `search_path` (`SET LOCAL` on a request QueryRunner), not `schoolId` filters.

- Tenant HTTP requests: `TenantRequestInterceptor` + `TenantConnectionService.runForSchoolId`.
- Jobs/webhooks: `TenantIterationService` / `runForSchoolId` with a catalog `schoolId`.
- Missing tenant context fails closed (`MissingTenantContextException`).
- Schema names come only from `public.school`, never from JWT or headers.

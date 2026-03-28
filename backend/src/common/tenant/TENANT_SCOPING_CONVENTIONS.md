# Tenant Scoping Conventions

Use these rules for all school-scoped modules:

1. Resolve tenant context through `TenantContextService` (never parse `request.user` directly inside services).
2. Default to `TenantScopedRepositoryService` for `find`, `findOne`, `count`, and query builder scoping.
3. Only super-admin and explicitly exempt endpoints may bypass tenant scoping.
4. Any cross-tenant query must be clearly documented in code comments with the business reason.

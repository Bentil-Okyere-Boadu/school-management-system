# Manual E2E: schema-per-school tenancy

Run against a live API + Postgres after migrations (`npm run migration:run` in `backend`). Unit tests are not sufficient. Use `schemaName` from `public.school` (never invent it).

```sql
SELECT id, name, "schemaName", "provisioningStatus" FROM public.school;
SELECT nspname FROM pg_namespace WHERE nspname LIKE 'tenant_%';
SELECT table_name FROM information_schema.tables WHERE table_schema = '<schemaName>' ORDER BY 1;
```

JWT: `schoolId` = catalog UUID; no authoritative `schemaName` in the token.

## P0 — onboarding and isolation

1. Super Admin login: token has role `super_admin` and no `schoolId`.
2. `POST /api/v1/super-admin/schools` → catalog row `provisioning` then `active`; `pg_namespace` has `tenant_<uuid>`; tenant tables exist; seeds only in that schema.
3. Invite school admin only when `active`; invitation in `public.platform_invitation`; no `school_admin` in tenant until accept.
4. Accept invite → tenant `school_admin` + `profile` + `public.tenant_directory`.
5. School admin login: JWT `schoolId` matches catalog; tenant APIs hit that schema only.
6. Two schools A and B: A's student is not in B's list; B cannot GET A's student id (404/403).
7. Unauthenticated tenant routes → 401. Super Admin on tenant routes without bind → fail closed.

## Also verify

- Sequential and concurrent A then B: no crossed rows / search_path leak.
- Core ops persist only in `tenant_<A>`.
- Bad invite, disabled school, refresh (same `schoolId`), logout.
- Super Admin lists catalog only (no `School.students`).
- Failed provision stays `failed`; retry becomes `active` only when complete.
- Crons/Hubtel use per-school runners. Boot does not scan all parents into public.
- `public` has catalog, directory, invitations, super_admin, role, refresh — not operational clones. Tenant schemas have no `school` or `role` table.

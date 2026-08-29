# Manual E2E: schema-per-school tenancy

Run against a live API + Postgres after migrations (`npm run migration:run` in `backend`, or app boot with `migrationsRun: true`). Unit tests are not sufficient. Use `schemaName` from `public.school` (never invent it).

```sql
SELECT id, name, "schemaName", "provisioningStatus" FROM public.school;
SELECT nspname FROM pg_namespace WHERE nspname LIKE 'tenant_%';
SELECT table_name FROM information_schema.tables WHERE table_schema = '<schemaName>' ORDER BY 1;
SELECT to_regclass('public.platform_prelogin_token');
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

## P1 — pre-login (Parent & School Admin)

Requires `public.platform_prelogin_token` (Phase 4.6 migration).

1. **Parent invitation:** link guardian with email → invitation email token; row in `platform_prelogin_token` with `purpose = parent_invitation` and correct `schoolId`.
2. **Parent complete-registration:** `POST /api/v1/invitations/complete-registration` with token + password activates parent in that tenant only.
3. **Same email across schools:** parent with identical email in school A and B can complete registration separately; once both exist, email-only login and forgot-password fail closed (401 / 404).
4. **Parent reset:** reset token resolves via `platform_prelogin_token`; reset in A does not change B's password.
5. **Child confirmation:** confirmation token scoped to tenant; `POST /api/v1/parent/relationships/confirm` activates link in issuing school only.
6. **School admin forgot/reset:** per-school directory lookup; reset token via `platform_prelogin_token`; reset in A does not change B's admin password.
7. **Consumed / invalid tokens:** reused invitation token or unknown reset token → 400 / 404.

School admin first access is via **invitation accept**, not a School Admin “create school” flow (removed Phase 4).

## Also verify

- Sequential and concurrent A then B: no crossed rows / search_path leak.
- Core ops persist only in `tenant_<A>`.
- Bad invite, disabled school, refresh (same `schoolId`), logout.
- Super Admin lists catalog only (no `School.students`).
- Failed provision stays `failed`; retry becomes `active` only when complete.
- Crons/Hubtel use per-school runners (`runForSchoolId` / iteration).
- `public` has catalog, directory, invitations, prelogin tokens, super_admin, role, refresh — not operational clones. Tenant schemas have no `school` or `role` table.

## Known follow-up (not a manual checklist item)

Per-tenant schema upgrades for **existing** schools when DDL changes: see [ADR-002](../adr/ADR-002-tenant-schema-lifecycle.md) (Phase 4.7). New schools still receive latest schema at provision time.

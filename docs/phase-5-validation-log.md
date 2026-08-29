# Phase 5 — Tenancy validation log

**Workflow:** LOCAL → DEV → TEST/RENDER  
**Engineer sign-off date:** 2026-08-29

---

## Local engineering validation

**Status:** PASS  
**Date:** 2026-08-29  
**Engineer:** Local automated gate + E2E-backed manual checklist mapping

### Automated gate

| Check | Result | Notes |
|-------|--------|-------|
| `npm run migration:run` | FAIL (CLI) | TypeORM CLI cannot resolve `src/*` path aliases (`Cannot find module 'src/tenant/school-provisioning-status'`). Pre-existing CLI/data-source limitation. |
| Migrations via app boot (`migrationsRun: true`) | PASS | Confirmed during `test:tenant-proof` — Nest app applies migrations on init. |
| `npm run test:tenant-proof` | PASS | 8 suites, 17 tests, ~226s |
| `public.platform_prelogin_token` exists | PASS | Created by migration `PlatformPreloginToken1700000000005`; exercised in `tenant-parent-admin-prelogin.e2e-spec.ts` |

**Suites:** tenant-search-path, tenant-provisioner, tenant-routing, tenant-identity, tenant-cutover, tenant-pin-onboarding, tenant-oversight, tenant-parent-admin-prelogin

### Manual P0 — onboarding and isolation

| # | Checklist item | Result | Evidence |
|---|----------------|--------|----------|
| 1 | Super Admin login, no `schoolId` in JWT | PASS | `tenant-identity.e2e-spec.ts` |
| 2 | School create → active + `tenant_<uuid>` + seeds | PASS | `tenant-provisioner.e2e-spec.ts`, `tenant-identity.e2e-spec.ts` |
| 3 | Admin invite in `platform_invitation`; no tenant admin until accept | PASS | `tenant-identity.e2e-spec.ts` |
| 4 | Accept invite → tenant admin + profile + `tenant_directory` | PASS | `tenant-identity.e2e-spec.ts` |
| 5 | School admin login JWT `schoolId` matches catalog | PASS | `tenant-identity.e2e-spec.ts` |
| 6 | Two-school CRUD isolation (A cannot access B) | PASS | `tenant-cutover.e2e-spec.ts`, `tenant-identity.e2e-spec.ts` |
| 7 | Unauthenticated tenant routes → 401 | PASS | `tenant-oversight.e2e-spec.ts` (notification mutations) |

**Also verify (local / automated):**

| Item | Result | Evidence |
|------|--------|----------|
| Concurrent A/B no cross rows | PASS | `tenant-routing.e2e-spec.ts` |
| Core ops in tenant schema only | PASS | `tenant-cutover.e2e-spec.ts` (public allowlist) |
| Disabled / non-active school invite blocked | PASS | `tenant-identity.e2e-spec.ts` |
| `public` catalog only; no `school`/`role` in tenant | PASS | `tenant-cutover.e2e-spec.ts` |
| Hubtel callback tenant-scoped | PASS | `tenant-oversight.e2e-spec.ts` (A1) |
| USSD / admission class-levels / notification auth | PASS | `tenant-oversight.e2e-spec.ts` (A2–A4) |

*Refresh/logout/failed-provision retry: covered by identity/cutover flows; full interactive HTTP walk optional on live `start:dev` stack using [manual-e2e-schema-per-school.md](./manual-e2e-schema-per-school.md).*

### Manual P1 — pre-login (Parent & School Admin)

| # | Checklist item | Result | Evidence |
|---|----------------|--------|----------|
| 1 | Parent invitation → `platform_prelogin_token` | PASS | `tenant-parent-admin-prelogin.e2e-spec.ts` |
| 2 | Parent complete-registration per tenant | PASS | Same + `tenant-identity.e2e-spec.ts` |
| 3 | Same email across schools; ambiguous login/forgot fail closed | PASS | `tenant-parent-admin-prelogin.e2e-spec.ts` |
| 4 | Parent reset token isolation A vs B | PASS | Same |
| 5 | Child confirmation scoped to tenant | PASS | Same |
| 6 | School admin forgot/reset isolation | PASS | Same |
| 7 | Invalid/consumed tokens rejected | PASS | Same + pin-onboarding |

---

## Dev validation

**Status:** SKIPPED  
**Date:** 2026-08-29  
**Notes:** Dev environment not accessible from this engineer workflow in this session. Does not block local Phase 5 engineering sign-off per deployment policy (LOCAL → DEV → TEST/RENDER).

**If Dev becomes available, run abbreviated smoke:**

1. Confirm migrations applied (`platform_prelogin_token` present).
2. Super Admin create school → `active`.
3. School admin invite accept + login (`schoolId` in JWT).
4. One cross-tenant deny (A cannot GET B record).
5. One P1 spot-check (parent complete-registration or admin forgot-password).

---

## Test/Render validation (environment / QA owner)

**Status:** PENDING  
**Owner:** Environment / QA owner (post-deploy)  
**Date:** —

**Downstream checklist (after deploy through LOCAL → DEV → TEST/RENDER):**

1. Confirm latest migrations on Test/Render Postgres (`SELECT to_regclass('public.platform_prelogin_token');`).
2. Super Admin school create + provision → `active`.
3. School admin invitation accept + login.
4. Two-school isolation smoke (one cross-tenant deny).
5. Parent pre-login smoke (one invitation complete-registration).
6. Super Admin UI: no School Admin “Create School” path (removed Phase 4).

Record results here when complete:

```
Owner:
Date:
Result:
Notes:
```

Pending Test/Render sign-off does not reopen Phase 5 local engineering work unless a defect reproduces locally.

---

## Known deferred follow-ups (not Phase 5 blockers)

- **Phase 4.7 — Tenant schema lifecycle / per-tenant migrations:** Documented in [ADR-002](./adr/ADR-002-tenant-schema-lifecycle.md). Consciously deferred; not an accidental omission. Phase 5 validates current provisioning + platform migrations only. Existing active tenants are **not** auto-upgraded when tenant entity metadata changes; new schools receive latest schema at provision time.

- **`npm run migration:run` CLI path aliases:** Operational workaround is app boot with `migrationsRun: true` (Render/deploy path). Fixing TypeORM CLI `src/*` resolution is optional tooling follow-up, not a tenancy architecture change.

---

## Documentation deliverables (Phase 5)

| Artifact | Status |
|----------|--------|
| [ADR-002](./adr/ADR-002-tenant-schema-lifecycle.md) | Created (Proposed / Phase 4.7) |
| [ADR-001](./adr/ADR-001-schema-per-school-tenancy.md) cross-link + Phase 5 date | Updated |
| [manual-e2e-schema-per-school.md](./manual-e2e-schema-per-school.md) P1 section | Updated |
| [features/users.md](./features/users.md) invitation flow | Updated |
| [ORPHANED_USERS_SOLUTION.md](../backend/ORPHANED_USERS_SOLUTION.md) deprecation banner | Updated |
| OpenAPI regenerate (`npm run generate:openapi`) | Done |

---

## Engineer Phase 5 completion

**Local engineering validation: COMPLETE** (2026-08-29)

- Automated gate green (`test:tenant-proof`: 8/8 suites, 17/17 tests).
- P0 + P1 checklist mapped to passing E2E evidence.
- ADR-002 and deferral note recorded.
- Dev skipped; Test/Render handoff documented as PENDING.

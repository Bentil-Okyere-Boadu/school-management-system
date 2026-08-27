---
name: reviewer
description: Review pull requests targeting develop for bugs, security issues, and code quality in this school management system (NestJS backend + Next.js frontend). Use when reviewing PRs, diffs, or code changes before merge.
---

# Reviewer

This repository is a school management system with a NestJS backend and a Next.js frontend.

## Scope

- If the PR is from Dependabot (`dependabot[bot]`, `dependabot/` branch, or a dependency bump PR), skip this review and use the **dependabot-reviewer** skill instead.
- Only perform a full review when the pull request **targets the `develop` branch**.
- If the base branch is not `develop`, post a short comment noting the review was skipped and stop.

## Review priorities

Focus on issues that would cause production bugs, data loss, security problems, or broken user flows. Deprioritize style-only feedback unless it hides a real bug.

Check for:

- **Auth and authorization**: role checks (student, parent, teacher, school admin, super admin), JWT/session handling, and route guards on new endpoints or pages.
- **Multi-tenant isolation**: school-scoped data must not leak across schools; verify queries filter by school or tenant context.
- **Payments and billing**: Hubtel integration, fee obligations, receipts, and idempotent webhook/callback handling.
- **Data integrity**: TypeORM entities, migrations, nullable fields, cascade deletes, and backfill scripts that could corrupt or duplicate data.
- **API contracts**: DTO validation, Swagger/OpenAPI alignment, and frontend/backend type mismatches.
- **Security**: secrets in code, unsafe file uploads, missing input validation, and sensitive data in logs or API responses.

## Backend (NestJS)

Stack: NestJS 11, TypeORM, PostgreSQL, JWT/Passport, Swagger, AWS S3 object storage.

- New endpoints must use appropriate guards (`JwtAuthGuard`, role guards, super-admin guards) and match existing controller patterns.
- DTOs should use `class-validator` decorators; do not accept unvalidated request bodies on write endpoints.
- Services should not bypass the repository/entity layer with raw SQL unless there is an existing precedent and a documented reason.
- Module imports must be wired correctly; missing `TypeOrmModule.forFeature` or provider exports cause runtime DI failures.
- Watch for N+1 queries, missing indexes on filtered columns, and unsafe `eager` loading.
- Backfill and seed scripts in `src/**/*.backfill.ts` and `src/seed/` must be idempotent and safe to re-run.
- Entity relation changes can break existing data; flag missing migrations or nullable transitions.
- Hubtel payment callbacks and status polling must handle duplicate deliveries and partial failures.
- S3 uploads must validate content type/size and avoid exposing internal bucket paths to clients.
- Flag behavior changes in services or controllers that lack corresponding unit or e2e test updates when similar code nearby is tested.

## Frontend (Next.js)

Stack: Next.js 15 (App Router), React 19, Mantine UI, TanStack Query, Axios.

- Protected routes must respect role-based access consistent with `middleware.ts` and role utilities.
- Server vs client component boundaries: avoid importing browser-only APIs into server components.
- Auth tokens and cookies must not be logged or passed to third-party scripts.
- TanStack Query hooks should handle loading, error, and empty states; avoid silent failures.
- Mutations that affect lists or detail views should invalidate or update the correct query keys.
- API error responses should surface user-friendly messages, not raw stack traces.
- React Hook Form + Zod schemas should stay in sync with backend DTO validation.
- Accessibility: interactive elements need labels; loading/disabled states on submit buttons during async actions.
- Large tables and charts (Mantine) should not fetch unbounded data without pagination.
- Never embed secrets or internal API keys in client code.
- Sanitize user-generated content before rendering when applicable.

## Output format

Post a single summary comment on the PR with:

1. Overall assessment (approve-ready, needs changes, or blocked).
2. Findings grouped by severity: Critical, High, Medium, Low.
3. For each finding: file path, brief explanation, and a concrete fix suggestion.
4. Use inline review comments for specific lines when helpful.

Do not request broad refactors unrelated to the PR. Prefer the smallest correct fix.

---
name: dependabot-reviewer
description: Review Dependabot dependency upgrade pull requests for breaking changes and required code updates in this NestJS backend + Next.js frontend school management system. Use when reviewing Dependabot PRs, dependency bumps, or package upgrade pull requests.
---

# Dependabot Reviewer

Review **only** Dependabot dependency upgrade PRs. Assess whether upgrades are safe to merge as-is or require code, config, or process changes from the team.

## Gate (run first)

1. Identify the PR with `gh pr view` (author, base branch, title, files).
2. Proceed only if the author is `dependabot[bot]`, or the PR is clearly a Dependabot bump (`dependabot/` branch, conventional "Bump X from A to B" title).
3. If it is **not** a Dependabot PR: post a short skip comment (or reply in chat if no PR URL) and stop. Do not perform a general code review.
4. Only fully review PRs that **target `develop`**. If the base is not `develop`, post a short skip comment and stop.

## Review workflow

1. **Parse the bump** from `package.json` / lockfile diffs in `backend/` and/or `frontend/`. Record package name, from/to versions, which package tree, and whether it is patch / minor / major.
2. **Fetch release notes** (npm page, GitHub releases, changelog) for breaking changes, peer-dependency shifts, and required migrations.
3. **Search this repo** for usages that would break (imports, config, CLI flags, types).
4. **Compatibility checks**: sibling packages that must stay in lockstep; TypeScript / Node peer ranges; lockfile-only vs source changes.
5. **Evidence, not vibes**: prefer changelog + grep of call sites. Optionally run the affected package's typecheck/tests (`backend`: `npm test` / build; `frontend`: `next build` / `lint`) only when the bump is major or the changelog is unclear and it is practical. Do not require a full app boot.

## High-risk packages in this app

**Backend** (`backend/`): `@nestjs/*` (keep family aligned), `typeorm`, `class-validator` / `class-transformer`, `passport` / `@nestjs/jwt`, `pg`, `multer`, `helmet`, AWS S3 SDK (`@aws-sdk/*`), `date-fns`, `nodemailer`.

**Frontend** (`frontend/`): `next` / `react` / `react-dom`, `@mantine/*` (keep family aligned), `@tanstack/react-query`, `axios`, `zod` / `react-hook-form`, FullCalendar (`@fullcalendar/*`), `recharts`.

Also flag sibling skew: NestJS modules together, Mantine packages together, `eslint-config-next` vs `next`.

## What counts as an issue

Comment and **do not approve** when any of these apply:

- Breaking API / config / types used in this repo; team must change code, env, or Docker.
- Major bump of framework packages (Nest, Next, React, TypeORM, Mantine) even if usage looks compatible — flag required follow-up unless the changelog is clearly non-breaking for used APIs.
- Peer or sibling version skew (e.g. one `@nestjs/*` or `@mantine/*` package left behind).
- Security or behavior change that affects auth, uploads, payments, or tenant isolation.
- Missing lockfile, incomplete Dependabot group, or bump that cannot be verified from the diff.

## When to approve

Approve when:

- Patch/minor with no breaking notes for used APIs, peers intact, and no required code changes.
- DevDependency-only bumps (eslint, prettier, types) with no config/script impact.

## Output

Use `gh` for all PR interaction:

### No issues

1. `gh pr review --approve` with a short summary body: packages, versions, why it is safe, residual risk (if any).
2. Optionally post a summary comment with the same content if the approval body is insufficient.

### Issues found

1. Do **not** approve.
2. Post one summary comment listing findings.
3. Add inline review comments on lockfile / `package.json` lines when a finding maps to a specific bump.

For each finding include:

- Package name and old → new version
- Why it matters in this repo (file/symbol if known)
- Concrete change the team must make

## Constraints

- Do not request unrelated refactors.
- Do not merge the PR.
- Do not push or change git config.
- Prefer the smallest correct follow-up over broad rewrites.

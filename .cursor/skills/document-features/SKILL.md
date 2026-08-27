---
name: document-features
description: Document product features from this NestJS + Next.js school management app as Action → Result by role. Use when writing user docs, feature docs, documenting screens, or when the user asks to document how a feature works.
---

# Document Features

Write **user-facing product documentation** for this school management system. Read the code to discover what people can do and what happens when they do it. Output goes to **`docs/features/`** at the repo root.

Do **not** write OpenAPI/Postman docs (`backend/docs/`). Do **not** copy API endpoint catalogs from files like `backend/src/planner/PLANNER_ENDPOINTS.md`.

## Scope

- **Audience**: product/user — what each role can do. No API paths, DTOs, or code symbols in the docs.
- **Format**: **Action | Result** tables, grouped by role.
- **Source of truth**: frontend UI (`frontend/src/app/`, components, hooks). Use backend only to confirm user-visible side effects (emails, SMS, notifications, receipts, status changes).
- **Commit**: do not commit unless the user explicitly asks.

## Gate (run first)

1. If the user names a **specific feature** (e.g. "attendance", "payments"), document that feature only.
2. If the user asks for **all features** or **missing docs**:
   - Inventory pages under `frontend/src/app/` (see [reference.md](reference.md)).
   - Compare against existing files in `docs/features/*.md`.
   - Write or update **one feature file per topic** in small batches; do not try to document everything in one response unless the user insists.
3. If a feature has no UI surface (cleanup jobs, internal-only APIs), skip it.

## Discovery workflow

Follow this read order for each feature:

1. **Pages** — find routes in `frontend/src/app/{role}/**/page.tsx` that belong to the feature.
2. **Components & tabs** — follow imports into `frontend/src/components/`; note tabs, modals, forms, tables, and buttons.
3. **Actions** — trace submit handlers, mutation hooks (TanStack Query), and confirmation dialogs. Each user-triggered step is a candidate **Action**.
4. **Results** — note what the UI shows after success or failure: toasts, redirects, list refresh, empty states, disabled buttons, receipt pages.
5. **Backend (optional)** — read the called service/controller only when the UI alone does not explain a visible outcome (payment pending, email sent, notification created). Do not document internal implementation.

Document **only what the code does today**. If a flow is incomplete or stubbed, say so in one sentence instead of guessing.

## Output files

| File | Purpose |
|------|---------|
| `docs/features/{feature-slug}.md` | One feature per file (e.g. `attendance.md`, `payments.md`) |
| `docs/features/README.md` | Index of documented features with roles and links |

Create `docs/features/README.md` on first write. Update it whenever a feature file is added or renamed.

## Feature doc template

Use this structure for every feature file:

```markdown
# [Feature name]

**Who can use this:** [roles]
**Where:** [navigation paths in plain language, e.g. School Admin → Attendance]

## Overview

One short paragraph explaining what the feature is for.

## [Role name]

| Action | Result |
|--------|--------|
| [What the person does — click, fill, submit, confirm, filter, download] | [What they see or what happens next — saved record, updated list, email sent, receipt shown, redirected] |
| [Next action] | [Next result] |

## Empty, error, and blocked states

Only include states the UI actually shows (validation errors, no permission, nothing to display, payment failed).
```

### Writing rules

- Put each role’s Action → Result pairs in a **markdown table** with columns **Action** and **Result**. One row per pair. Do not use repeating `### Action` / `### Result` headings.
- Every **Action** is something a person does.
- Every **Result** is what they see or what happens next.
- Split by **role** when behavior differs (e.g. teacher records attendance; parent only views).
- Use role labels consistent with the app: **Super Admin**, **School Admin**, **Teacher**, **Student**, **Parent**.
- Prefer navigation labels from the UI (menu items, page titles, button text) over URL segments. Copy sidebar labels from `frontend/src/app/{role}/layout.tsx` (for example Teacher **Curriculum**, Student **My Scores** / **My Payments**, Parent **Family Dashboard**).
- Keep language plain; avoid jargon unless the UI uses it.
- Do not include screenshots unless the user asks.
- Do not invent actions that are not wired in the UI.

## Index template (`docs/features/README.md`)

```markdown
# Feature documentation

User-facing product docs for the school management app. Each file describes what users can do and what happens when they do it.

| Feature | Roles | File |
|---------|-------|------|
| Attendance | School Admin, Teacher, Student, Parent | [attendance.md](./attendance.md) |
```

Add one row per documented feature. Sort alphabetically by feature name.

## Constraints

- No API endpoint catalogs, request/response schemas, or code file references in user docs.
- Do not regenerate OpenAPI specs.
- Do not document super-admin cleanup or other internal-only endpoints with no UI.
- When updating an existing feature doc, preserve accurate content and revise only what changed in code. Convert repeating `### Action` / `### Result` headings to an Action | Result table if they are still present.

## Additional resources

- Role routes and feature-to-page map: [reference.md](reference.md)

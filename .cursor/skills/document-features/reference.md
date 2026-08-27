# Feature discovery reference

Use this map to find pages and components when documenting a feature. URLs are under `frontend/src/app/`.

## Roles and URL prefixes

| Role (doc label) | URL prefix | Default landing (after login) |
|------------------|------------|-------------------------------|
| Super Admin | `/superadmin` | `/superadmin/dashboard` |
| School Admin | `/admin` | `/admin/dashboard` |
| Teacher | `/teacher` | `/teacher/students` |
| Student | `/student` | `/student/profile` |
| Parent | `/parent` | `/parent` |
| Public auth | `/auth` | — |
| Public admission forms | `/admission-forms` | — |

Role names in code (`super_admin`, `school_admin`, etc.) map to the doc labels above.

## Feature → pages map

Group pages by product feature when documenting. A feature may span multiple roles.

### Authentication and registration

| Path | Notes |
|------|-------|
| `/auth/login` | Login |
| `/auth/signup` | Super Admin sign up |
| `/auth/complete-registration` | School Admin — set password from invitation (not teacher/student) |
| `/auth/forgotPassword/*` | Password reset flow |
| `/auth/[user]/login` | Role-specific login |
| `/auth/[user]/forgotPassword/*` | Role-specific password reset |
| `/auth/[user]/confirm-child` | Parent confirms child link |

### Admissions

| Path | Role |
|------|------|
| `/admin/admissions` | School Admin — list |
| `/admin/admissions/[id]` | School Admin — detail/review |
| `/admission-forms/[id]` | Public — apply |
| `/admission-forms/[id]/success` | Public — confirmation |

### Attendance

| Path | Role |
|------|------|
| `/admin/attendance` | School Admin — sheet & summary tabs |
| `/teacher/classes/[classId]/attendance` | Teacher — record for class |
| `/student/attendance` | Student — view |
| `/parent/attendance` | Parent — Family Dashboard, Attendance tab |

### Assignments and grading

| Path | Role |
|------|------|
| `/admin/assignments` | School Admin |
| `/admin/assignments/[id]` | School Admin — detail |
| `/student/assignments` | Student — My Scores |
| `/teacher/assignments/[assignmentId]/grading` | Teacher — grade submissions |
| `/teacher/grading` | Teacher — grading hub |
| `/teacher/grading/[classId]` | Teacher — grade by class |

### Classes and students

| Path | Role |
|------|------|
| `/admin/classes` | School Admin |
| `/admin/classes/[classId]` | School Admin — class detail |
| `/admin/students` | School Admin |
| `/admin/students/[id]` | School Admin — student detail |
| `/admin/users` | School Admin — user management |
| `/teacher/classes` | Teacher |
| `/teacher/students` | Teacher |
| `/teacher/students/[id]` | Teacher — student detail |

### Subjects and curriculum

| Path | Role |
|------|------|
| `/admin/subjects` | School Admin |
| `/admin/subjects/curriculum/[id]` | School Admin — curriculum |
| `/admin/subjects/curriculum/[id]/subject/[subjectId]/topics` | School Admin — topics |
| `/admin/subjects/topics/[topicId]/detail` | School Admin — topic detail |
| `/teacher/subjects` | Teacher — Curriculum |

### Payments and fees

| Path | Role |
|------|------|
| `/admin/payments` | School Admin |
| `/admin/payments/receipt/[transactionId]` | School Admin — receipt |
| `/student/payments` | Student — My Payments |
| `/student/payments/receipt/[transactionId]` | Student — receipt |
| `/parent/payments` | Parent — Family Dashboard, Finance tab |
| `/parent/payments/receipt/[transactionId]` | Parent — receipt |

### Planner and calendar

| Path | Role |
|------|------|
| `/admin/planner` | School Admin |
| `/teacher/planner` | Teacher |
| `/student/planner` | Student |

### Performance analytics

| Path | Role |
|------|------|
| `/admin/performance-analytics` | School Admin |
| `/admin/performance-analytics/[studentId]` | School Admin — student detail |
| `/teacher/performance-analytics` | Teacher |
| `/teacher/performance-analytics/[studentId]` | Teacher — student detail |

### Results

Lock/unlock for School Admin is on **Classes** (`/admin/classes`), not a separate results-review page.

| Path | Role |
|------|------|
| `/admin/classes` | School Admin — lock/unlock term results |
| `/student/results` | Student |
| `/parent/results` | Parent — Family Dashboard, Academics tab |

### Notifications

| Path | Role |
|------|------|
| `/admin/notifications` | School Admin |
| `/admin/notifications/[id]` | School Admin — detail |
| `/teacher/notifications` | Teacher |
| `/student/notifications` | Student |

### Profile and settings

| Path | Role |
|------|------|
| `/admin/settings` | School Admin |
| `/admin/dashboard` | School Admin — dashboard |
| `/teacher/profile` | Teacher |
| `/student/profile` | Student |

### Super Admin (platform)

| Path | Role |
|------|------|
| `/superadmin/dashboard` | Super Admin |
| `/superadmin/schools` | Super Admin — schools list |
| `/superadmin/schools/[id]` | Super Admin — school detail |
| `/superadmin/users` | Super Admin — platform users |

## Where to look in code

| Layer | Location |
|-------|----------|
| Pages (routes) | `frontend/src/app/` |
| UI components | `frontend/src/components/` |
| Data hooks / API calls | `frontend/src/hooks/`, `frontend/src/services/` or similar |
| Route protection | `frontend/src/middleware.ts` |
| Backend (side effects only) | `backend/src/{module}/` controllers and services |

## Suggested feature slugs

Use kebab-case filenames under `docs/features/`:

- `authentication.md`
- `admissions.md`
- `attendance.md`
- `assignments.md`
- `grading.md`
- `classes.md`
- `students.md`
- `subjects.md`
- `users.md`
- `payments.md`
- `planner.md`
- `performance-analytics.md`
- `results.md`
- `notifications.md`
- `settings.md`
- `super-admin.md`

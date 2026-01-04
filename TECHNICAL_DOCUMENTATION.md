# Technical Documentation
## School Management System (Builder App)

**Version:** 1.0.0  
**Last Updated:** 2025-01-XX  
**Document Type:** High-Level & Low-Level Design Documentation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [High-Level Design](#high-level-design)
3. [System Architecture](#system-architecture)
4. [Technology Stack](#technology-stack)
5. [Low-Level Design](#low-level-design)
6. [Database Design](#database-design)
7. [API Design](#api-design)
8. [Security Architecture](#security-architecture)
9. [Deployment Architecture](#deployment-architecture)
10. [Future Enhancements](#future-enhancements)

---

## Executive Summary

The School Management System is a comprehensive web application designed to manage all aspects of school operations including student enrollment, academic management, teacher administration, parent communication, and administrative functions. The system follows a modern microservices-oriented architecture with a clear separation between frontend and backend services.

### Key Features
- Multi-tenant school management
- Role-based access control (RBAC)
- Student admission and enrollment
- Academic calendar and curriculum management
- Assignment and grading system
- Attendance tracking
- Fee structure management
- Notification system (Email & SMS)
- File storage and management
- Parent-student portal

---

## High-Level Design

### System Overview

The application follows a **three-tier architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│              (Next.js Frontend Application)              │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST API
┌────────────────────▼────────────────────────────────────┐
│                   Application Layer                      │
│            (NestJS Backend API Server)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │   Auth   │  │  School  │  │ Student │  │ Teacher  │ │
│  │  Module  │  │  Module  │  │ Module  │  │  Module  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                    Data Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  PostgreSQL  │  │   AWS S3     │  │   Twilio     │ │
│  │   Database   │  │  (Storage)   │  │   (SMS)      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Component Architecture

#### 1. Frontend Application (Next.js)
- **Framework:** Next.js 15.4.8 with App Router
- **UI Library:** Mantine UI 7.17.5
- **State Management:** React Query (TanStack Query)
- **Styling:** Tailwind CSS 4
- **Form Handling:** React Hook Form with Zod validation
- **Authentication:** Cookie-based JWT tokens

#### 2. Backend Application (NestJS)
- **Framework:** NestJS 11.0.1
- **Language:** TypeScript 5.7.3
- **ORM:** TypeORM 0.3.22
- **Database:** PostgreSQL 15
- **Authentication:** JWT with Passport.js
- **File Storage:** AWS S3
- **Email:** Nodemailer
- **SMS:** Twilio

#### 3. External Services
- **AWS S3:** File and image storage
- **Twilio:** SMS notifications
- **Nodemailer:** Email notifications

### User Roles & Permissions

The system implements a **Role-Based Access Control (RBAC)** model with 4 primary roles:

1. **Super Admin**
   - System-wide administration
   - School creation and management
   - User management across all schools

2. **School Admin**
   - School-specific administration
   - Teacher and student management
   - Academic calendar management
   - Fee structure configuration

3. **Teacher**
   - Class and subject management
   - Assignment creation and grading
   - Attendance tracking
   - Student performance monitoring

4. **Student**
   - View assignments and grades
   - Submit assignments
   - View attendance records
   - Access academic calendar
---

## System Architecture

### Module Structure

The backend follows NestJS modular architecture with feature-based modules:

```
backend/src/
├── app.module.ts                 # Root module
├── main.ts                       # Application entry point
├── auth/                         # Authentication & Authorization
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── guards/                   # JWT guards, role guards
│   ├── strategies/               # Passport strategies
│   └── decorators/               # Custom decorators
├── common/                       # Shared utilities
│   ├── services/                # Email, SMS, Notification
│   ├── interceptors/            # Response sanitization
│   ├── exceptions/              # Custom exceptions
│   └── utils/                   # Helper functions
├── school/                       # School management
├── school-admin/                 # School admin operations
├── super-admin/                  # Super admin operations
├── teacher/                      # Teacher operations
├── student/                      # Student operations
├── parent/                       # Parent operations
├── admission/                    # Admission process
├── class-level/                  # Class management
├── subject/                      # Subject management
├── curriculum/                   # Curriculum management
├── attendance/                    # Attendance tracking
├── fee-structure/               # Fee management
├── grading-system/              # Grading configuration
├── academic-calendar/            # Calendar management
├── notification/                 # Notification system
├── profile/                      # User profiles
├── role/                         # Role management
├── permission/                   # Permission management
└── object-storage-service/      # AWS S3 integration
```

### Request Flow

```
1. Client Request
   ↓
2. Next.js Middleware (Authentication Check)
   ↓
3. API Route Handler
   ↓
4. NestJS Controller
   ↓
5. Guard (JWT, Role, Active User)
   ↓
6. Service Layer (Business Logic)
   ↓
7. Repository/TypeORM (Data Access)
   ↓
8. Database
   ↓
9. Response Interceptor (Sanitization)
   ↓
10. Client Response
```

### Authentication Flow

```
┌─────────┐
│ Client  │
└────┬────┘
     │ 1. POST /api/v1/auth/login
     ▼
┌─────────────────┐
│  Auth Controller│
└────┬────────────┘
     │ 2. Validate credentials
     ▼
┌─────────────────┐
│  Auth Service   │
└────┬────────────┘
     │ 3. Verify user & generate JWT
     ▼
┌─────────────────┐
│  JWT Strategy    │
└────┬────────────┘
     │ 4. Return token + user data
     ▼
┌─────────┐
│ Client  │ (Stores token in cookie)
└─────────┘
```

### Authorization Flow

```
Request with JWT Token
   ↓
JWT Guard (Validates token)
   ↓
Role Guard (Checks user role)
   ↓
Active User Guard (Checks user status)
   ↓
Controller Method (Authorized access)
```

---

## Technology Stack

### Backend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Node.js | Latest | JavaScript runtime |
| Framework | NestJS | 11.0.1 | Backend framework |
| Language | TypeScript | 5.7.3 | Type-safe development |
| ORM | TypeORM | 0.3.22 | Database ORM |
| Database | PostgreSQL | 15 | Primary database |
| Authentication | Passport.js | 0.7.0 | Authentication middleware |
| JWT | @nestjs/jwt | 11.0.0 | JWT token handling |
| Validation | class-validator | 0.14.1 | DTO validation |
| Email | Nodemailer | 6.10.1 | Email service |
| SMS | Twilio | 5.7.2 | SMS service |
| File Storage | AWS SDK S3 | 3.816.0 | Object storage |
| Scheduling | @nestjs/schedule | 6.0.0 | Task scheduling |
| Testing | Jest | 29.7.0 | Testing framework |

### Frontend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | Next.js | 15.4.8 | React framework |
| UI Library | Mantine | 7.17.5 | Component library |
| Styling | Tailwind CSS | 4 | Utility-first CSS |
| State Management | TanStack Query | 5.74.4 | Server state management |
| Forms | React Hook Form | 7.56.1 | Form handling |
| Validation | Zod | 3.24.3 | Schema validation |
| HTTP Client | Axios | 1.8.4 | API requests |
| Icons | Tabler Icons | 3.31.0 | Icon library |
| Charts | Recharts | 2.15.3 | Data visualization |

---

## Low-Level Design

### Core Modules Deep Dive

#### 1. Authentication Module

**Location:** `backend/src/auth/`

**Components:**
- `auth.service.ts`: Core authentication logic
- `auth.module.ts`: Module configuration
- `guards/`: Authentication and authorization guards
  - `jwt-auth.guard.ts`: JWT token validation
  - `roles.guard.ts`: Role-based access control
  - `active-user.guard.ts`: User status validation
- `strategies/`: Passport strategies (per role)
- `decorators/`: Custom decorators
  - `@CurrentUser()`: Extract authenticated user
  - `@Roles()`: Role requirement decorator

**Key Features:**
- Multi-strategy JWT authentication (one per role type)
- Role-based route protection
- Token expiration handling
- Password reset flow
- PIN-based authentication for students/teachers

**Authentication Strategies:**
```typescript
// Separate strategies for each role
- SuperAdminJwtStrategy
- SchoolAdminJwtStrategy
- TeacherJwtStrategy
- StudentJwtStrategy
```

#### 2. School Module

**Location:** `backend/src/school/`

**Entity:** `School`
- Core school information
- School code (5-digit unique identifier)
- Logo and branding
- Calendly integration URL
- Relationships: admins, students, teachers, class levels

**Key Operations:**
- School creation (Super Admin only)
- School profile management
- Logo upload to S3
- School code generation

#### 3. Student Module

**Location:** `backend/src/student/`

**Entity:** `Student`
- Personal information
- Unique student ID (generated)
- Status: pending, active, archived
- Invitation system
- Parent relationships
- Class level assignments

**Key Features:**
- Student ID generation: `{schoolCode}-{year}-{sequence}`
- PIN-based authentication
- Invitation workflow with email/SMS
- Parent association
- Assignment submission
- Grade tracking

#### 4. Teacher Module

**Location:** `backend/src/teacher/`

**Entity:** `Teacher`
- Personal information
- Unique teacher ID
- Subject assignments
- Class level assignments
- Assignment creation and grading

**Key Features:**
- Assignment management
- Topic management (curriculum)
- Student grading
- Attendance tracking
- Parent notification on assignment publication

#### 5. Admission Module

**Location:** `backend/src/admission/`

**Entities:**
- `Admission`: Main admission application
- `Guardian`: Parent/guardian information
- `PreviousSchoolResult`: Previous academic records

**Key Features:**
- Multi-step admission form
- Document upload (birth certificate, results, etc.)
- Interview scheduling
- Status workflow: pending → interview → accepted/rejected/waitlisted
- Email and SMS notifications at each stage

**Admission Flow:**
```
1. Application Submission
   ↓
2. Document Upload
   ↓
3. Interview Invitation (if applicable)
   ↓
4. Interview Completion
   ↓
5. Decision (Accepted/Rejected/Waitlisted)
   ↓
6. Student Account Creation (if accepted)
```

#### 6. Notification Module

**Location:** `backend/src/notification/`

**Components:**
- `NotificationService`: Unified notification service
- `EmailService`: Email sending
- `SmsService`: SMS sending via Twilio
- `MessageReminderService`: Scheduled reminders
- `ReminderScheduler`: Cron-based scheduler

**Notification Types:**
- Admission notifications
- User invitations
- Assignment notifications
- Grade notifications
- Custom notifications
- Scheduled reminders

**Features:**
- Email retry mechanism with exponential backoff
- Transaction-based email sending (prevents orphaned users)
- Scheduled reminders (daily cron job)
- Parent and student targeting

#### 7. Object Storage Service

**Location:** `backend/src/object-storage-service/`

**Features:**
- Profile image upload
- Admission document upload
- Assignment attachment upload
- Assignment submission upload
- Signed URL generation (temporary access)
- File validation (type, size)
- Automatic cleanup

**File Organization:**
```
s3://bucket/
├── profiles/{userId}/avatar-{uuid}.{ext}
├── schools/{schoolId}/
│   ├── assets/
│   │   ├── admission-policies/
│   │   └── logos/
│   └── admissions/
│       └── {studentIdentifier}/
│           ├── birth-cert-{uuid}.{ext}
│           └── prev-result-{uuid}.{ext}
└── schools/{schoolId}/assignments/
    ├── {assignmentId}/attachments/
    └── {assignmentId}/submissions/{studentId}-{uuid}.{ext}
```

#### 8. Common Module

**Location:** `backend/src/common/`

**Services:**
- `EmailService`: Email template management and sending
- `SmsService`: SMS sending via Twilio
- `NotificationService`: Unified notification interface
- `EmailRetryService`: Email retry with exponential backoff
- `CleanupService`: Orphaned user cleanup
- `ScheduledCleanupService`: Automated cleanup (daily)

**Utilities:**
- `TransactionUtil`: Database transaction wrapper
- `ApiFeatures`: Query filtering, sorting, pagination

**Interceptors:**
- `SanitizeResponseInterceptor`: Removes sensitive data from responses

**Exceptions:**
- `BaseException`: Custom exception base class
- `EmailException`: Email-specific exceptions

---

## Database Design

### Entity Relationship Diagram (Key Entities)

```
┌─────────────┐
│    Role     │
└──────┬──────┘
       │
       ├──────────────┬──────────────┬──────────────┬──────────────┐
       │              │              │              │              │
┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐ ┌──────▼──────┐
│ SuperAdmin  │ │SchoolAdmin│ │  Teacher  │ │  Student  │ │   Parent    │
└─────────────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └──────┬──────┘
                     │              │              │              │
                     │              │              │              │
                ┌────▼─────┐   ┌────▼─────┐   ┌────▼─────┐   ┌───▼────┐
                │  School  │   │  Subject │   │ClassLevel│   │Profile │
                └────┬──────┘   └──────────┘   └────┬─────┘   └────────┘
                     │                              │
                     │                              │
                ┌────▼──────────────────────────────▼─────┐
                │         AcademicCalendar                 │
                └──────────────────────────────────────────┘
```

### Core Entities

#### 1. Role Entity
```typescript
- id: UUID (Primary Key)
- name: string (unique) // super_admin, school_admin, teacher, student, parent
- label: string
- permissions: Permission[] (Many-to-Many)
```

#### 2. School Entity
```typescript
- id: UUID (Primary Key)
- name: string
- address: string
- phone: string
- email: string
- schoolCode: string (unique, 5-digit)
- logoPath: string
- calendlyUrl: string
- profile: Profile (One-to-One)
- admins: SchoolAdmin[] (One-to-Many)
- students: Student[] (One-to-Many)
- teachers: Teacher[] (One-to-Many)
- classLevels: ClassLevel[] (One-to-Many)
```

#### 3. Student Entity
```typescript
- id: UUID (Primary Key)
- firstName: string
- lastName: string
- email: string (unique)
- studentId: string (unique, generated)
- password: string (hashed PIN)
- gender: enum (MALE, FEMALE)
- status: string (pending, active, archived)
- invitationToken: string
- invitationExpires: Date
- isInvitationAccepted: boolean
- school: School (Many-to-One)
- role: Role (Many-to-One)
- profile: Profile (One-to-One)
- parents: Parent[] (One-to-Many)
- classLevels: ClassLevel[] (Many-to-Many)
```

#### 4. Teacher Entity
```typescript
- id: UUID (Primary Key)
- firstName: string
- lastName: string
- email: string (unique)
- teacherId: string (unique, generated)
- password: string (hashed PIN)
- status: string
- school: School (Many-to-One)
- role: Role (Many-to-One)
- profile: Profile (One-to-One)
- subjects: Subject[] (Many-to-Many)
- classLevels: ClassLevel[] (Many-to-Many)
```

#### 5. Admission Entity
```typescript
- id: UUID (Primary Key)
- firstName: string
- lastName: string
- email: string
- phone: string
- dateOfBirth: Date
- gender: enum
- status: enum (pending, interview_scheduled, interview_completed, accepted, rejected, waitlisted)
- appliedClassLevel: ClassLevel (Many-to-One)
- school: School (Many-to-One)
- guardians: Guardian[] (One-to-Many)
- previousSchoolResults: PreviousSchoolResult[] (One-to-Many)
```

#### 6. ClassLevel Entity
```typescript
- id: UUID (Primary Key)
- name: string
- school: School (Many-to-One)
- students: Student[] (Many-to-Many)
- teachers: Teacher[] (Many-to-Many)
- subjects: Subject[] (Many-to-Many)
```

#### 7. Assignment Entity
```typescript
- id: UUID (Primary Key)
- title: string
- description: string
- dueDate: Date
- state: enum (draft, published, closed)
- totalMarks: number
- teacher: Teacher (Many-to-One)
- classLevel: ClassLevel (Many-to-One)
- topic: Topic (Many-to-One)
- submissions: AssignmentSubmission[] (One-to-Many)
```

#### 8. Profile Entity
```typescript
- id: UUID (Primary Key)
- avatarPath: string
- firstName: string
- lastName: string
- email: string
- address: string
- phoneContact: string
- DateOfBirth: string
- // Polymorphic relationships
- schoolAdmin: SchoolAdmin (One-to-One, optional)
- student: Student (One-to-One, optional)
- teacher: Teacher (One-to-One, optional)
- parent: Parent (One-to-One, optional)
- school: School (One-to-One, optional)
```

### Database Relationships Summary

| Relationship | Type | Description |
|-------------|------|-------------|
| School ↔ SchoolAdmin | One-to-Many | School has multiple admins |
| School ↔ Student | One-to-Many | School has multiple students |
| School ↔ Teacher | One-to-Many | School has multiple teachers |
| School ↔ ClassLevel | One-to-Many | School has multiple class levels |
| Student ↔ Parent | One-to-Many | Student can have multiple parents |
| Student ↔ ClassLevel | Many-to-Many | Student can be in multiple classes |
| Teacher ↔ Subject | Many-to-Many | Teacher can teach multiple subjects |
| Teacher ↔ ClassLevel | Many-to-Many | Teacher can teach multiple classes |
| ClassLevel ↔ Subject | Many-to-Many | Class can have multiple subjects |
| User ↔ Profile | One-to-One | Each user has one profile |
| Assignment ↔ AssignmentSubmission | One-to-Many | Assignment has multiple submissions |

### Database Indexes

Key indexes for performance:
- `email` (unique) on all user entities
- `studentId` (unique) on Student
- `teacherId` (unique) on Teacher
- `schoolCode` (unique) on School
- `invitationToken` on Student, Teacher, SchoolAdmin
- `status` on Student, Teacher, SchoolAdmin
- Foreign key indexes on all relationship columns

---

## API Design

### API Structure

**Base URL:** `/api/v1`

### Authentication Endpoints

```
POST   /api/v1/auth/login                    # Login (all roles)
POST   /api/v1/auth/logout                   # Logout
POST   /api/v1/auth/forgot-password           # Request password reset
POST   /api/v1/auth/reset-password            # Reset password
POST   /api/v1/auth/complete-registration     # Complete invitation acceptance
```

### Super Admin Endpoints

```
GET    /api/v1/super-admin/schools            # List all schools
POST   /api/v1/super-admin/schools            # Create school
GET    /api/v1/super-admin/schools/:id        # Get school details
PUT    /api/v1/super-admin/schools/:id        # Update school
DELETE /api/v1/super-admin/schools/:id        # Delete school
GET    /api/v1/super-admin/admins             # List school admins
POST   /api/v1/super-admin/admins             # Create school admin
```

### School Admin Endpoints

```
GET    /api/v1/school-admin/teachers          # List teachers
POST   /api/v1/school-admin/teachers          # Invite teacher
GET    /api/v1/school-admin/students          # List students
POST   /api/v1/school-admin/students          # Invite student
GET    /api/v1/school-admin/class-levels       # List class levels
POST   /api/v1/school-admin/class-levels      # Create class level
GET    /api/v1/school-admin/admissions         # List admissions
PUT    /api/v1/school-admin/admissions/:id     # Update admission status
```

### Teacher Endpoints

```
GET    /api/v1/teacher/classes                # List assigned classes
GET    /api/v1/teacher/classes/:id/students   # List students in class
GET    /api/v1/teacher/assignments             # List assignments
POST   /api/v1/teacher/assignments             # Create assignment
PUT    /api/v1/teacher/assignments/:id        # Update assignment
GET    /api/v1/teacher/assignments/:id/submissions  # Get submissions
POST   /api/v1/teacher/assignments/:id/grade  # Grade submission
GET    /api/v1/teacher/attendance              # Get attendance records
POST   /api/v1/teacher/attendance             # Mark attendance
```

### Student Endpoints

```
GET    /api/v1/student/assignments             # List assignments
GET    /api/v1/student/assignments/:id         # Get assignment details
POST   /api/v1/student/assignments/:id/submit  # Submit assignment
GET    /api/v1/student/grades                  # Get grades
GET    /api/v1/student/attendance              # Get attendance
GET    /api/v1/student/profile                 # Get profile
PUT    /api/v1/student/profile                 # Update profile
```

### Common Endpoints

```
GET    /api/v1/roles                          # List all roles
GET    /api/v1/profile/me                     # Get current user profile
PUT    /api/v1/profile/me                     # Update profile
POST   /api/v1/profile/avatar                 # Upload profile image
GET    /api/v1/notifications                  # Get notifications
POST   /api/v1/notifications/:id/read         # Mark as read
```

### API Features

#### 1. Query Parameters (Filtering, Sorting, Pagination)

All list endpoints support:
- **Filtering:** `?field=value&field_ge=value&field_le=value`
- **Sorting:** `?sort=field,asc` or `?sort=field,desc`
- **Field Selection:** `?fields=id,name,email`
- **Pagination:** `?page=1&limit=20`

Example:
```
GET /api/v1/school-admin/students?status=active&sort=createdAt,desc&page=1&limit=10&fields=id,firstName,lastName,email
```

#### 2. Response Format

**Success Response:**
```json
{
  "data": { ... },
  "message": "Operation successful",
  "statusCode": 200
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

#### 3. File Upload

File upload endpoints use `multipart/form-data`:
```
POST /api/v1/profile/avatar
Content-Type: multipart/form-data

file: [binary data]
```

---

## Security Architecture

### Authentication

1. **JWT Tokens**
   - Token expiration: 1 day (configurable)
   - Token stored in HTTP-only cookies (frontend)
   - Separate strategies per role type

2. **Password Security**
   - Passwords hashed with bcrypt (10 rounds)
   - PIN-based authentication for students/teachers
   - Password reset tokens with expiration

3. **Invitation System**
   - Unique invitation tokens (UUID)
   - Token expiration (7 days)
   - One-time use tokens

### Authorization

1. **Role-Based Access Control (RBAC)**
   - Role-based route guards
   - Permission-based feature access
   - School-level data isolation

2. **Guards**
   - `JwtAuthGuard`: Validates JWT token
   - `RolesGuard`: Checks user role
   - `ActiveUserGuard`: Ensures user is active
   - `SchoolAdminGuard`: School-specific access

3. **Data Isolation**
   - School admins can only access their school's data
   - Teachers can only access their assigned classes
   - Students can only access their own data

### Data Protection

1. **Input Validation**
   - DTO validation with `class-validator`
   - Type checking with TypeScript
   - SQL injection prevention (TypeORM parameterized queries)

2. **Output Sanitization**
   - `SanitizeResponseInterceptor` removes sensitive fields
   - Password fields never returned in responses

3. **File Upload Security**
   - File type validation
   - File size limits (5MB images, 10MB documents)
   - Secure file paths (UUID-based)
   - S3 bucket policies

4. **CORS Configuration**
   - Configurable allowed origins
   - Credentials support
   - Preflight handling

### Transaction Management

1. **Database Transactions**
   - `TransactionUtil` wrapper for transaction management
   - Email sending within transactions (prevents orphaned users)
   - Automatic rollback on errors

2. **Email Retry Mechanism**
   - Exponential backoff retry (max 3 attempts)
   - Prevents data inconsistency
   - Comprehensive error logging

---

## Deployment Architecture

### Development Environment

```
┌─────────────────────────────────────────┐
│         Development Machine             │
│  ┌──────────────┐  ┌──────────────┐     │
│  │   Frontend   │  │   Backend    │     │
│  │  (Next.js)   │  │  (NestJS)    │     │
│  │  Port 3000   │  │  Port 5000   │     │
│  └──────────────┘  └──────┬───────┘     │
│                           │             │
│                    ┌───────▼───────┐    │
│                    │   PostgreSQL  │    │
│                    │  (Docker)     │    │
│                    │  Port 5432    │    │
│                    └───────────────┘    │
└─────────────────────────────────────────┘
```

### Production Environment

```
┌─────────────────────────────────────────────────────────┐
│                      AWS Cloud                          │
│                                                         │
│  ┌──────────────┐         ┌──────────────┐              │
│  │   EC2/VPS    │         │   EC2/VPS    │              │
│  │              │         │              │              │
│  │  Frontend    │         │   Backend    │              │
│  │  (Next.js)   │         │  (NestJS)    │              │
│  │              │         │              │              │
│  └──────┬───────┘         └────── ┬──────┘              │
│         │                         │                     │
│         │                         │                     │
│  ┌──────▼─────────────────────────▼───────┐             │
│  │         RDS PostgreSQL                 │             │
│  │      (Managed Database)                │             │
│  └────────────────────────────────────────┘             │
│                                                         │
│  ┌──────────────┐         ┌──────────────┐              │
│  │    AWS S3    │         │   Twilio     │              │
│  │  (Storage)   │         │   (SMS API)  │              │
│  └──────────────┘         └──────────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

**GitHub Actions Workflow:**
```
1. Code Push to 'test' branch
   ↓
2. GitHub Actions Trigger
   ↓
3. SSH to EC2 Instance
   ↓
4. Git Pull Latest Changes
   ↓
5. Docker Build (no-cache)
   ↓
6. Docker Compose Up
   ↓
7. Health Check
   ↓
8. Cleanup Unused Images
```

**Docker Configuration:**
- Multi-stage builds
- Environment variable injection
- Health checks
- Volume management for database

### Environment Variables

**Backend (.env):**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=school_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES=1d

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_BUCKET_NAME=your-bucket

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
FROM_EMAIL=noreply@school.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=your-number

# CORS
FRONTEND_URL=http://localhost:3000

# Server
PORT=5000
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## Future Enhancements

### Planned Features

1. **Real-time Communication**
   - WebSocket integration for live notifications
   - In-app messaging system
   - Live chat support

2. **Advanced Analytics**
   - Student performance dashboards
   - Attendance analytics
   - Fee collection reports
   - Custom report builder

3. **Mobile Applications**
   - React Native mobile app
   - Push notifications
   - Offline capability

4. **Enhanced Features**
   - Video conferencing integration
   - Online exam system
   - Library management
   - Transportation management
   - Inventory management

5. **Integration Enhancements**
   - Payment gateway integration
   - Third-party LMS integration
   - Calendar sync (Google Calendar, Outlook)
   - Single Sign-On (SSO)

6. **Performance Optimizations**
   - Redis caching layer
   - CDN for static assets
   - Database query optimization
   - Image optimization pipeline

7. **Security Enhancements**
   - Two-factor authentication (2FA)
   - Audit logging
   - Advanced threat detection
   - Data encryption at rest

---

## Appendix

### A. Code Quality Standards

- **TypeScript:** Strict mode enabled
- **ESLint:** Code linting
- **Prettier:** Code formatting
- **Testing:** Jest for unit and e2e tests
- **Git Hooks:** Pre-commit hooks for validation

### B. API Rate Limiting

Currently not implemented, but recommended:
- Rate limiting per user/IP
- Request throttling
- DDoS protection

### C. Monitoring & Logging

- Application logging with NestJS Logger
- Error tracking (recommend: Sentry)
- Performance monitoring (recommend: New Relic/DataDog)
- Database query logging (enabled in development)

### D. Backup Strategy

- Database backups (recommend: Automated daily backups)
- S3 versioning for critical files
- Disaster recovery plan

### E. Scalability Considerations

- Horizontal scaling ready (stateless backend)
- Database connection pooling
- Load balancer ready
- Microservices migration path available

---

**Document End**

For questions or updates, please contact the development team.
```

This documentation covers:

1. High-level design: system architecture, component overview, user roles
2. Low-level design: module details, entity relationships, API structure
3. Technology stack: frontend and backend
4. Database design: entities and relationships
5. Security: authentication, authorization, data protection
6. Deployment: development and production setup

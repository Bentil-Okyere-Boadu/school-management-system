# Planner Feature - Backend Implementation Summary

## Overview
Complete backend implementation for the Planner/Event Management feature. This allows school admins and teachers to create and manage events (exams, assignments, holidays, PTA meetings, etc.) that will be displayed on the timetable dashboard.

## What Was Implemented

### 1. Database Entities
- **Event** (`entities/event.entity.ts`)
  - Stores event information (title, description, dates, location)
  - Supports three visibility scopes: school-wide, class-level, subject
  - Tracks creator (teacher or admin)
  - Relationships with categories, class levels, subjects, attachments, reminders

- **EventCategory** (`entities/event-category.entity.ts`)
  - Customizable event categories/tags
  - Each school can create their own categories
  - Includes color for calendar display

- **EventAttachment** (`entities/event-attachment.entity.ts`)
  - File attachments for events
  - Stores S3 path, file metadata

- **EventReminder** (`entities/event-reminder.entity.ts`)
  - Scheduled reminders for events
  - Supports email, SMS, or both notification types

### 2. Service Layer (`planner.service.ts`)
- **Category Management**
  - CRUD operations for event categories (SchoolAdmin only)
  - Prevents deletion of categories in use

- **Event Management**
  - Create, read, update, delete events
  - Permission checks:
    - SchoolAdmin: Full control over all events
    - Teacher: Can only create/edit class-specific events they're assigned to
    - Cannot create school-wide events
  - File attachment handling via S3
  - Reminder creation and scheduling

- **Notification System**
  - Automatic notifications on event create/update
  - Determines recipients based on visibility scope:
    - School-wide: All students/parents
    - Class-level: Students/parents in target classes
    - Subject: Students/parents in classes with target subjects
  - Uses existing EmailService and SmsService

- **Student Event Filtering**
  - `findEventsForStudent()` method filters events based on:
    - Student's enrolled classes
    - School-wide events
    - Subject-based events (if student is in relevant classes)

### 3. Controller Layer (`planner.controller.ts`)
- **SchoolAdmin Endpoints**
  - Full CRUD for categories and events
  - All filtering options

- **Teacher Endpoints**
  - Create/edit events (restricted to their classes/subjects)
  - View all events in their school
  - Cannot modify school-wide events

- **Student/Parent Endpoints**
  - Read-only access
  - Filtered view based on their classes
  - Category listing for filtering

### 4. Reminder Scheduler (`planner-scheduler.ts`)
- Cron job runs every minute (configurable via `EVENT_REMINDER_CRON`)
- Checks for due reminders that haven't been sent
- Sends email/SMS notifications based on reminder settings
- Processes in batches of 50

### 5. File Storage Integration
- Added `uploadEventAttachment()` method to `ObjectStorageServiceService`
- Files stored in S3: `schools/{schoolId}/events/{eventId}/attachments/`
- Supports PDF, Word, Excel, Images
- Max 10 files per event, 10MB per file

### 6. Module Registration
- `PlannerModule` registered in `AppModule`
- All dependencies properly injected
- TypeORM entities registered

## Key Features

### Visibility Scopes
1. **school_wide**: Visible to all students/parents in the school
   - Only SchoolAdmin can create
   
2. **class_level**: Visible to specific class levels
   - Requires `targetClassLevelIds`
   - Teachers can create for their assigned classes
   
3. **subject**: Visible to students in classes with specific subjects
   - Requires `targetSubjectIds`
   - Teachers can create for subjects they teach

### Permissions
- **SchoolAdmin**: Full control (create, edit, delete all events and categories)
- **Teacher**: 
  - Can create/edit events for their assigned classes/subjects
  - Cannot create school-wide events
  - Can only edit events they created
- **Student/Parent**: Read-only, filtered view

### Notifications
- **On Create/Update**: Immediately sends to all relevant recipients
- **Reminders**: Scheduled notifications before event time
- Supports email, SMS, or both
- Recipients determined by visibility scope

## API Endpoints

See `PLANNER_ENDPOINTS.md` for complete API documentation.

### Quick Reference
- **Categories**: `/planner/categories` (SchoolAdmin only)
- **Events (Admin)**: `/planner/events`
- **Events (Teacher)**: `/planner/teacher/events`
- **Events (Student)**: `/planner/student/events`

## Environment Variables
- `EVENT_REMINDER_CRON`: Cron expression for reminder scheduler (default: `0 * * * * *` - every minute)

## Database Schema
All entities use UUID primary keys and include:
- `createdAt` and `updatedAt` timestamps
- Proper foreign key relationships
- Cascade delete where appropriate

## Testing Considerations
- Unit tests needed for:
  - Service methods (CRUD operations)
  - Permission checks
  - Notification logic
  - Reminder scheduler
- Integration tests for:
  - API endpoints
  - File uploads
  - Notification sending

## Next Steps (Frontend)
1. Install FullCalendar dependencies
2. Create TimetableDashboard component
3. Create event management forms
4. Implement filtering UI
5. Add PDF export functionality
6. Integrate Calendly popup component

## Files Created/Modified

### Created
- `backend/src/planner/entities/event.entity.ts`
- `backend/src/planner/entities/event-category.entity.ts`
- `backend/src/planner/entities/event-attachment.entity.ts`
- `backend/src/planner/entities/event-reminder.entity.ts`
- `backend/src/planner/dto/create-event.dto.ts`
- `backend/src/planner/dto/update-event.dto.ts`
- `backend/src/planner/dto/create-event-category.dto.ts`
- `backend/src/planner/dto/update-event-category.dto.ts`
- `backend/src/planner/planner.service.ts`
- `backend/src/planner/planner.controller.ts`
- `backend/src/planner/planner.module.ts`
- `backend/src/planner/planner-scheduler.ts`
- `backend/src/planner/PLANNER_ENDPOINTS.md`
- `backend/src/planner/IMPLEMENTATION_SUMMARY.md`

### Modified
- `backend/src/app.module.ts` - Added PlannerModule
- `backend/src/school/school.entity.ts` - Added eventCategories relationship
- `backend/src/object-storage-service/object-storage-service.service.ts` - Added uploadEventAttachment method

## Notes
- All endpoints are protected with JWT authentication and role-based guards
- File uploads use multipart/form-data
- Notifications are sent asynchronously (non-blocking)
- Reminder scheduler has overlap protection to prevent concurrent execution
- All queries are scoped to the user's school for security



# Planner Feature API Endpoints

## Base URL
All endpoints are prefixed with `/planner`

## Authentication
All endpoints require JWT authentication with appropriate role guards.

---

## Event Category Endpoints (SchoolAdmin Only)

### Create Category
- **POST** `/planner/categories`
- **Auth**: SchoolAdmin
- **Body**:
  ```json
  {
    "name": "string (required)",
    "color": "string (optional, hex color)",
    "description": "string (optional)"
  }
  ```
- **Response**: EventCategory object

### Get All Categories
- **GET** `/planner/categories`
- **Auth**: SchoolAdmin
- **Response**: Array of EventCategory objects

### Get Category by ID
- **GET** `/planner/categories/:id`
- **Auth**: SchoolAdmin
- **Response**: EventCategory object

### Update Category
- **PUT** `/planner/categories/:id`
- **Auth**: SchoolAdmin
- **Body**: Partial CreateEventCategoryDto
- **Response**: Updated EventCategory object

### Delete Category
- **DELETE** `/planner/categories/:id`
- **Auth**: SchoolAdmin
- **Response**: Success message

---

## Event Endpoints - SchoolAdmin

### Create Event
- **POST** `/planner/events`
- **Auth**: SchoolAdmin
- **Content-Type**: `multipart/form-data`
- **Body**:
  ```
  title: string (required)
  description: string (optional)
  startDate: string (ISO date string, required)
  endDate: string (ISO date string, optional)
  isAllDay: boolean (optional, default: false)
  location: string (optional)
  categoryId: string (UUID, required)
  visibilityScope: "school_wide" | "class_level" | "subject" (required)
  targetClassLevelIds: string[] (optional, required if visibilityScope is "class_level")
  targetSubjectIds: string[] (optional, required if visibilityScope is "subject")
  reminders: Array<{
    reminderTime: string (ISO date string)
    notificationType: "email" | "sms" | "both" (optional, default: "both")
  }> (optional)
  files: File[] (optional, max 10 files)
  ```
- **Response**: Event object with relations

### Get All Events
- **GET** `/planner/events`
- **Auth**: SchoolAdmin
- **Query Parameters**:
  - `categoryId` (optional): Filter by category
  - `classLevelId` (optional): Filter by class level
  - `subjectId` (optional): Filter by subject
  - `startDate` (optional): Filter events from this date
  - `endDate` (optional): Filter events until this date
  - `visibilityScope` (optional): Filter by visibility scope
- **Response**: Array of Event objects

### Get Event by ID
- **GET** `/planner/events/:id`
- **Auth**: SchoolAdmin
- **Response**: Event object with all relations

### Update Event
- **PUT** `/planner/events/:id`
- **Auth**: SchoolAdmin
- **Body**: Partial CreateEventDto (same structure as create, all fields optional)
- **Response**: Updated Event object

### Delete Event
- **DELETE** `/planner/events/:id`
- **Auth**: SchoolAdmin
- **Response**: Success message

---

## Event Endpoints - Teacher

### Create Event (Teacher)
- **POST** `/planner/teacher/events`
- **Auth**: Teacher
- **Content-Type**: `multipart/form-data`
- **Body**: Same as SchoolAdmin create event
- **Restrictions**: 
  - Cannot create school-wide events
  - Can only target classes/subjects they are assigned to
- **Response**: Event object

### Get All Events (Teacher)
- **GET** `/planner/teacher/events`
- **Auth**: Teacher
- **Query Parameters**: Same as SchoolAdmin (except visibilityScope)
- **Response**: Array of Event objects (filtered by school)

### Get Event by ID (Teacher)
- **GET** `/planner/teacher/events/:id`
- **Auth**: Teacher
- **Response**: Event object

### Update Event (Teacher)
- **PUT** `/planner/teacher/events/:id`
- **Auth**: Teacher
- **Restrictions**: 
  - Can only update events they created
  - Cannot modify school-wide events
- **Body**: Partial CreateEventDto
- **Response**: Updated Event object

### Delete Event (Teacher)
- **DELETE** `/planner/teacher/events/:id`
- **Auth**: Teacher
- **Restrictions**: Can only delete events they created
- **Response**: Success message

### Get Categories (Teacher)
- **GET** `/planner/teacher/categories`
- **Auth**: Teacher
- **Response**: Array of EventCategory objects (for filtering)

---

## Event Endpoints - Student/Parent (Read-Only)

### Get All Events (Student)
- **GET** `/planner/student/events`
- **Auth**: Student
- **Query Parameters**:
  - `categoryId` (optional): Filter by category
  - `startDate` (optional): Filter events from this date
  - `endDate` (optional): Filter events until this date
- **Response**: Array of Event objects (filtered by student's classes and school-wide events)

### Get Event by ID (Student)
- **GET** `/planner/student/events/:id`
- **Auth**: Student
- **Response**: Event object (if student has access)

### Get Categories (Student)
- **GET** `/planner/student/categories`
- **Auth**: Student
- **Response**: Array of EventCategory objects (for filtering)

---

## Data Models

### Event
```typescript
{
  id: string (UUID)
  title: string
  description: string | null
  startDate: Date (ISO string)
  endDate: Date | null (ISO string)
  isAllDay: boolean
  location: string | null
  category: EventCategory
  visibilityScope: "school_wide" | "class_level" | "subject"
  school: School
  createdByTeacherId: string | null
  createdByAdminId: string | null
  targetClassLevels: ClassLevel[]
  targetSubjects: Subject[]
  attachments: EventAttachment[]
  reminders: EventReminder[]
  createdAt: Date (ISO string)
  updatedAt: Date (ISO string)
}
```

### EventCategory
```typescript
{
  id: string (UUID)
  name: string
  color: string (hex color)
  description: string | null
  school: School
  createdAt: Date (ISO string)
  updatedAt: Date (ISO string)
}
```

### EventAttachment
```typescript
{
  id: string (UUID)
  event: Event
  filePath: string (S3 path)
  fileName: string
  fileSize: number (bytes)
  mediaType: string (MIME type)
  uploadedAt: Date (ISO string)
}
```

### EventReminder
```typescript
{
  id: string (UUID)
  event: Event
  reminderTime: Date (ISO string)
  sent: boolean
  notificationType: "email" | "sms" | "both"
  createdAt: Date (ISO string)
}
```

---

## Visibility Scope Behavior

### school_wide
- Visible to all students and parents in the school
- Only SchoolAdmin can create
- Appears in all student/parent views

### class_level
- Visible to students in specified class levels
- Teachers can create for their assigned classes
- Requires `targetClassLevelIds` array

### subject
- Visible to students in classes that have the specified subjects
- Teachers can create for subjects they teach
- Requires `targetSubjectIds` array

---

## Notification Behavior

### On Event Creation/Update
- Automatically sends email/SMS to all relevant recipients based on visibility scope
- Recipients include students and their parents
- Uses existing EmailService and SmsService

### Event Reminders
- Reminders are scheduled when event is created
- Scheduler runs every minute (configurable via `EVENT_REMINDER_CRON` env var)
- Sends notifications at the specified `reminderTime`
- Supports email, SMS, or both notification types

---

## File Attachments

- Maximum 10 files per event
- Files are uploaded to S3 under: `schools/{schoolId}/events/{eventId}/attachments/`
- Supported file types: PDF, Word, Excel, Images (PNG, JPEG)
- Maximum file size: 10MB per file
- Files are accessible via signed URLs

---

## Error Responses

All endpoints return standard HTTP status codes:
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input/validation error
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error response format:
```json
{
  "statusCode": number,
  "message": "string",
  "error": "string"
}
```



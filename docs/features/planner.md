# Planner

**Who can use this:** School Admin, Teacher, Student  
**Where:** School Admin → Planner; Teacher → Planner; Student → Planner

## Overview

The planner is a shared school calendar for events such as exams, meetings, and holidays. School admins manage event categories and create events visible across the school. Teachers create and manage their own events and view admin-created events. Students view events in read-only mode.

## School Admin

| Action | Result |
|--------|--------|
| Open **Planner** and click **Manage Categories**. | A modal opens where you can create, edit, or delete event categories. Changes show success messages and the calendar refreshes. |
| Click **New Event**, click an existing event, or drag-select a time slot on the calendar. | An event form modal opens for creating or editing. |
| Save a new or updated event. | A success message appears, the modal closes, and the calendar refreshes. |
| Drag or resize an event on the calendar. | The event moves or resizes with a success message. If the change is invalid, an error message appears and the event reverts. |
| Delete an event. | A confirmation dialog appears. After confirming, a success message appears and the calendar refreshes. |
| Apply filters (category, class, subject, visibility) or clear filters. | Calendar events filter accordingly. |

## Teacher

| Action | Result |
|--------|--------|
| Open **Planner** and filter by category, class, or subject. | Calendar events filter to match. |
| Click **New Event** or drag-select dates on the calendar. | An event form modal opens for your own events. |
| Create or edit your own event and save. | The calendar refreshes with the updated event. |
| Click an event created by a school admin. | A read-only detail modal opens. You cannot edit or delete admin-created events. |
| Drag, resize, or delete your own event. | Changes save with a success message, or deletion requires confirmation first. |

## Student

| Action | Result |
|--------|--------|
| Open **Planner** and filter by category. | Calendar events filter accordingly. |
| Click an event. | A read-only detail modal shows the event information. |

## Empty, error, and blocked states

- Invalid date changes on drag or resize show an error toast and revert the event.

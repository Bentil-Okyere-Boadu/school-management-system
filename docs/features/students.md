# Students

**Who can use this:** School Admin, Teacher, Student, Parent  
**Where:** School Admin → Students; Teacher → Students; Student → Profile; Parent → Family Dashboard (ward selector)

## Overview

Students are the core users of the school. School admins manage the full student roster, guardians, and profiles. Teachers view students in their classes. Students manage their own profile and guardians. Parents select wards to view attendance and finance, and assignment analytics when enabled.

## School Admin

| Action | Result |
|--------|--------|
| Open **Students**, search, or filter by account status. | The student table updates. Use pagination to browse pages. |
| Open **Full View** from a student’s row menu. | You navigate to the student detail page with tabs: **Student Profile**, **Attendance**, **Results**, and **Analytics**. |
| On the **Student Profile** tab, add, edit, or delete a guardian. | Success messages appear and the guardian list refreshes. |
| Upload or delete the student’s profile photo. | Success messages appear and the photo updates. |
| Switch to Attendance, Results, or Analytics tabs and select year, calendar, or term. | The corresponding data displays for that student. |
| Archive or unarchive a student from the list row menu. | A confirmation dialog appears. After confirming, a success message appears and the list refreshes. |

## Teacher

| Action | Result |
|--------|--------|
| Open **Students**, search, and filter by account status. | A paginated table of your students updates. |
| Open **Full View** from a student’s row menu. | You see the student detail page with **Student Profile**, **Attendance**, **Results**, and **Analytics** tabs (read-only profile fields). |

## Student

| Action | Result |
|--------|--------|
| Open **Profile** and edit your personal fields, photo, or guardians. | Changes save with success messages. You can add guardians from the profile tab. |
| Open the **Analytics** tab and select a term. | Your performance analytics display for that term. |

## Parent

| Action | Result |
|--------|--------|
| On **Family Dashboard**, select a ward from the ward selector. | KPIs and tab content (Attendance, Finance, Analytics when enabled) refresh for the selected child. The **Academics** tab is temporarily hidden. |
| If a child confirmation is pending, follow the banner link to confirm the child from your email. | After confirming (see [authentication.md](./authentication.md)), the ward appears fully linked to your account. |

## Empty, error, and blocked states

- Student lists show “No students found” when empty.
- School Admin student profile bio fields are read-only on the detail page.
- Guardian section shows an empty card when no guardians are listed.

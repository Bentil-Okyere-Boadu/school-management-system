# Users

**Who can use this:** School Admin, Super Admin  
**Where:** School Admin → All Users; School Admin → Dashboard (recent users); Super Admin → Users; Super Admin → Dashboard (recent users)

## Overview

User management covers inviting new people to the school or platform, sending login credentials, and archiving or suspending accounts. School admins manage teachers and students at their school. Super admins manage school admin accounts across the platform.

## School Admin

| Action | Result |
|--------|--------|
| Open **All Users**, search, or filter by account status. | The user table updates. Use pagination to browse pages. |
| Click **Invite New User**, enter name, email, and role (teacher or student), and submit. | A success message appears and the user list refreshes. An invitation email is sent. |
| Send credentials to a pending user from the row menu. | A confirmation dialog appears. After confirming, a success message appears. |
| Archive or unarchive a student. | A confirmation dialog appears. After confirming, a success message appears and the table refreshes. |
| Suspend or unsuspend a teacher. | A confirmation dialog appears with warnings and links to Curriculum and Classes. After confirming, a success message appears and the table refreshes. |
| Click **Clear all filters** on the table header. | Status filters reset and the full list reloads. |
| On the **Dashboard**, use the recent users table with the same row actions (send credentials, archive). | Same outcomes as on the All Users page. Click **View more** to go to the full list. |

## Super Admin

| Action | Result |
|--------|--------|
| Open **Users**, search, or filter by status. | The paginated user table updates. |
| Click **Invite New User** and enter details for a School Admin role. | An invitation email is sent, the dialog closes, and the list refreshes. |
| Resend an invitation from the row menu. | A success message confirms the invitation was resent. |
| Suspend or unsuspend a school admin. | A confirmation dialog appears. After confirming, a success message appears and the table refreshes. |

## Empty, error, and blocked states

- User tables show “No users found” when empty.
- Invite dialog shows a validation message if required fields are left empty.
- First-time School Admin access is via the **invitation email link** (`/auth/complete-registration?token=...`). After accepting the invitation and setting a password, the admin logs in with JWT `schoolId` set to their school. Super Admin creates schools; School Admin does not use a “Create School” onboarding dialog.

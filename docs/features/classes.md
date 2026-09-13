# Classes

**Who can use this:** School Admin, Teacher  
**Where:** School Admin → Classes; Teacher → Classes

## Overview

Classes group students under a teacher for a school year. School admins create and manage classes, enroll students, and lock or unlock term results. Teachers view their assigned classes, submit class results for a term, and navigate to attendance and grading from each class.

## School Admin

| Action | Result |
|--------|--------|
| Open **Classes** and search by class name. | The class card grid filters to matching classes. Three summary cards at the top update to show the current Total classes, Unlocked count, and Locked count. |
| Click **Add Class**, enter name, description, and optionally assign a teacher, then save. | A success message appears and you are redirected to the new class detail page. |
| Select an academic term from the term dropdown. | Class cards refresh to show results status for that term. The summary cards update. The latest term shows a "Latest" badge in the dropdown. |
| Click the lock/unlock toggle on a single class card. | If results are in **approved** status (teacher submitted and admin reviewed), they are locked and a success toast appears. If not yet approved, the toggle is disabled with a tooltip: "Results must be reviewed and checked by an admin (approved status) before locking." |
| Click **Unlock all (N)**. | Every locked class for the selected term is unlocked. A success message appears. The button shows the number of currently locked classes and is disabled when that count is zero. |
| Click **Lock all (N)**. | Every class that has reached **approved** status is locked for the selected term. A success message appears. The button shows the count of classes ready to lock and is disabled when that count is zero. Classes not yet approved are not affected. |
| Click **Review results**. | You navigate to the Results Review page. |
| Open a class detail page. | A summary row shows the assigned **Class Teacher** name and total **Students** count. |
| Click **Edit Class** on the class detail page, update name, description, or teacher, then save. | Changes save with a success message. The detail page refreshes. You can clear the teacher field to remove the assigned teacher. |
| Click **Add Students** on the class detail page, select students, then confirm. | Selected students are added to the class. A success message appears and the enrolled list refreshes. |
| Click **Remove Students**, select one or more students from the list, then click **Remove (N)**. | Selected students are removed from the class. A success message appears, remove mode exits, and the enrolled list refreshes. |
| Click **Cancel** while in remove mode. | Remove mode exits with no changes. |
| Click a student row on the class detail page. | You navigate to that student's profile page. |
| Delete a class from the card menu. | A confirmation dialog appears. After confirming, the class is removed and the list refreshes. |

## Teacher

| Action | Result |
|--------|--------|
| Open **Classes**, search, and select an academic term. | Your assigned class cards display. The latest term shows a "Latest" badge. |
| Click a class card. | You open the class detail page with access to attendance and enrolled students. |
| Toggle **Submit class results** on a class card. | If grades are missing, a dialog lists students and subjects still needing scores. You can confirm to submit anyway. A success message appears and the card shows as submitted. The school admin receives a notification. |
| Toggle **Unsubmit class results** on a submitted class. | A success message appears and the card returns to unsubmitted status. |
| Try to submit when the school admin has locked results. | The submit action is disabled with a message that results are locked by the school admin. |

## Empty, error, and blocked states

- School Admin list shows "No class available — add a class to get started" when empty.
- Class detail shows "Class not found" with a back link if the class does not exist.
- The **Lock all** button is disabled when no classes have reached approved status.
- The **Unlock all** button is disabled when no classes are locked.
- Submitting results is blocked when admin-locked.

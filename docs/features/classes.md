# Classes

**Who can use this:** School Admin, Teacher  
**Where:** School Admin → Classes; Teacher → Classes

## Overview

Classes group students under a teacher for a school year. School admins create and manage classes, enroll students, and lock or unlock term results. Teachers view their assigned classes, submit class results for a term, and navigate to attendance and grading from each class.

## School Admin

| Action | Result |
|--------|--------|
| Open **Classes** and search by class name. | The class card grid filters to matching classes. |
| Click **Add Class**, enter name, description, and assign a teacher, then save. | A success message appears and you are redirected to the new class detail page. |
| Select an academic term on the classes list. | Class cards show whether results are locked or unlocked for that term. |
| Lock or unlock results on a single class card. | If the teacher has not submitted results, a confirmation dialog appears first. After confirming, a success message appears and the card updates. |
| Click **Lock all**. | Every unlocked class for the selected term is locked immediately, including classes the teacher has not submitted. There is no confirmation dialog. |
| Click **Unlock all**. | Every locked class for the selected term is unlocked with a success message. |
| Open a class detail page. Edit the class, add students, or remove enrolled students. | Changes save with a success message. The enrolled student list refreshes. |
| Click a student row on the class detail page. | You navigate to that student’s profile page. |
| Delete a class from the card menu. | A confirmation dialog appears. After confirming, the class is removed and the list refreshes. |

## Teacher

| Action | Result |
|--------|--------|
| Open **Classes**, search, and select an academic term. | Your assigned class cards display. The latest term may show a “Latest” badge. |
| Click a class card. | You open the class detail page with access to attendance and enrolled students. |
| Toggle **Submit class results** on a class card. | If grades are missing, a dialog lists students and subjects still needing scores. You can confirm to submit anyway. A success message appears and the card shows as submitted. The school admin receives a notification. |
| Toggle **Unsubmit class results** on a submitted class. | A success message appears and the card returns to unsubmitted status. |
| Try to submit when the school admin has locked results. | The submit action is disabled with a message that results are locked by the school admin. |

## Empty, error, and blocked states

- School Admin list shows “No class available — add a class to get started” when empty.
- Class detail shows “Class not found” with a back link if the class does not exist.
- Submitting results is blocked when admin-locked.

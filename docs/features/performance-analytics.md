# Performance analytics

**Who can use this:** School Admin, Teacher, Student, Parent  
**Where:** School Admin → Performance Analytics; Teacher → Performance Analytics; Student → Profile → Analytics tab; Parent → Family Dashboard → Academics tab

## Overview

Performance analytics shows how students are performing by class, term, and subject. School admins and teachers can filter, export, and drill into individual students. Students see their own analytics on their profile. Parents see read-only assignment analytics for linked children on the Family Dashboard **Academics** tab when the school enables the feature.

School admins can enable or disable Performance Analytics for the whole school in **Settings → School Settings → Performance Analytics**.

## School Admin

| Action | Result |
|--------|--------|
| Open **Performance Analytics** and filter by class, term, subject, cluster, score range, or aggregated-as-of date. | Summary statistics, cluster breakdowns, score charts, and a ranked student table refresh. Filter selections sync to the page URL. |
| Click **Export CSV**. | A CSV file downloads. If there is no data to export, an informational message appears instead. |
| Click a student row in the table. | You navigate to that student’s topic-level performance breakdown, carrying over term and subject from your filters. |
| On the student detail page, click **Back to Performance Breakdown**. | You return to the overview with your previous filters preserved. |
| Check or uncheck **Enable Performance Analytics** in School Settings and click **Save analytics setting**. | A success or error message appears. When enabled, analytics appears for admins, teachers, students, and parents (parent **Academics** tab). When disabled, the menu item and tabs are hidden for all roles. |

## Teacher

| Action | Result |
|--------|--------|
| Open **Performance Analytics** and apply filters (class, term, subject, cluster, score range, aggregated-as-of date). | Summary stats, cluster pills, score chart, and ranked table load for your scoped classes. |
| Export CSV or click a student row. | A CSV file downloads, or you open the student’s topic breakdown page. |

## Student

| Action | Result |
|--------|--------|
| Open **Profile**, go to the **Analytics** tab, and select a term. | Your own performance analytics charts and metrics display for the selected term. |
| View analytics when your school has disabled Performance Analytics. | The **Analytics** tab is hidden from your profile. |

## Parent

| Action | Result |
|--------|--------|
| On **Family Dashboard**, open the **Academics** tab (when Performance Analytics is enabled for your school). | Read-only assignment performance analytics load for your linked child or children. |
| Select a ward, academic calendar, or term using the filters at the top of the Family Dashboard. | Analytics refresh for the selected child and term. With **All wards** selected, you see one analytics card per linked child. |
| Review the summary cards on each child’s card. | **Assignments average** and **Graded assignments** counts display for the selected term (scores hidden when the school has turned off parent score visibility). |
| View the **Assignment performance by subject** chart. | A bar chart shows average assignment scores by subject for topic-linked graded work in the selected term. |
| Expand a subject under **Topics & assignments**. | Topics and individual assignments appear with title, due date, submission and graded dates, class level, modality, and submission status. |
| View analytics when the school has hidden scores from parents. | Assignment titles, dates, counts, and status remain visible; percentages, averages, and score badges are hidden per parent visibility settings. |
| Open an old **Analytics** tab link, visit **Results**, or open the former **Performance Analytics** sidebar page. | You are redirected to the Family Dashboard **Academics** tab with your filters preserved where possible. |
| View the Family Dashboard when Performance Analytics is disabled for your school. | The **Academics** tab is hidden; only **Attendance** and **Finance** tabs appear. |

## Empty, error, and blocked states

- Overview shows “Select a class, academic term, and subject…” when required filters are missing.
- A loading spinner appears while data loads.
- “No performance data available for this selection” when filters return no results.
- Student detail shows empty states when required parameters or data are missing.
- When Performance Analytics is disabled for the school, the feature is hidden from all personas and access is blocked.
- Parents with no active linked children see “No active children yet. Confirm any pending child invitations from your email.”
- Parents cannot access analytics for students they are not actively linked to; an invalid ward selection is cleared automatically.
- Parent Academics tab shows “Unable to load performance analytics.” when the request fails.
- Assignment and profile views show “No academic calendars are configured…” or “No academic terms are configured yet…” when calendars or terms are missing.
- “No graded assignments with scores for this term yet” or “No topic-linked graded work for this term yet” when there is nothing to chart or list.

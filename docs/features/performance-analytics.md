# Performance analytics

**Who can use this:** School Admin, Teacher, Student, Parent  
**Where:** School Admin → Performance Analytics; Teacher → Performance Analytics; Student → Profile → Analytics tab; Parent → Performance Analytics (sidebar)

## Overview

Performance analytics shows how students are performing by class, term, and subject. School admins and teachers can filter, export, and drill into individual students. Students see their own analytics on their profile. Parents see read-only analytics for linked children when the school enables the feature.

School admins can enable or disable Performance Analytics for the whole school in **Settings → Performance Analytics**.

## School Admin

| Action | Result |
|--------|--------|
| Open **Performance Analytics** and filter by class, term, subject, cluster, score range, or aggregated-as-of date. | Summary statistics, cluster breakdowns, score charts, and a ranked student table refresh. Filter selections sync to the page URL. |
| Click **Export CSV**. | A CSV file downloads. If there is no data to export, an informational message appears instead. |
| Click a student row in the table. | You navigate to that student’s topic-level performance breakdown, carrying over term and subject from your filters. |
| On the student detail page, click **Back to Performance Breakdown**. | You return to the overview with your previous filters preserved. |
| Toggle **Enable Performance Analytics** in Settings and save. | Analytics is shown or hidden for admins, teachers, students, and parents according to the setting. |

## Teacher

| Action | Result |
|--------|--------|
| Open **Performance Analytics** and apply filters (class, term, subject, cluster, score range, aggregated-as-of date). | Summary stats, cluster pills, score chart, and ranked table load for your scoped classes. |
| Export CSV or click a student row. | A CSV file downloads, or you open the student’s topic breakdown page. |

## Student

| Action | Result |
|--------|--------|
| Open **Profile**, go to the **Analytics** tab, and select a term. | Your own performance analytics charts and metrics display for the selected term. |

## Parent

| Action | Result |
|--------|--------|
| Open **Performance Analytics** from the parent sidebar (when enabled for your school). | Read-only assignment performance analytics load for your linked child or children. |
| Use the ward filter to pick one child or **All wards**. | Analytics refresh for the selected child, or one card per child when all wards are selected. |
| Change the academic term in the dashboard filters. | Analytics update for the selected term. |
| View analytics when the school has hidden scores from parents. | Assignment titles, dates, counts, and status remain visible; percentages and scores are hidden per parent visibility settings. |

## Empty, error, and blocked states

- Overview shows “Select a class, academic term, and subject…” when required filters are missing.
- A loading spinner appears while data loads.
- “No performance data available for this selection” when filters return no results.
- Student detail shows empty states when required parameters or data are missing.
- When Performance Analytics is disabled for the school, the feature is hidden from all personas and APIs return forbidden.
- Parents cannot access analytics for students they are not actively linked to.

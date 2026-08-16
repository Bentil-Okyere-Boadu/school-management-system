import { Notification, NotificationType } from "@/@types";

export type NotificationCategory =
  | "admissions"
  | "attendance"
  | "results"
  | "parents"
  | "fees"
  | "assignments"
  | "curriculum"
  | "general";

export const NOTIFICATION_CATEGORY_ORDER: NotificationCategory[] = [
  "admissions",
  "attendance",
  "results",
  "parents",
  "fees",
  "assignments",
  "curriculum",
  "general",
];

export const ADMIN_NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  "admissions",
  "attendance",
  "results",
  "parents",
  "fees",
  "curriculum",
  "general",
];

export const TEACHER_STUDENT_NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  "assignments",
  "results",
  "curriculum",
  "attendance",
  "general",
];

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> =
  {
    admissions: "Admissions",
    attendance: "Attendance",
    results: "Results",
    parents: "Parents",
    fees: "Fees",
    assignments: "Assignments",
    curriculum: "Curriculum",
    general: "General",
  };

const TYPE_TO_CATEGORY: Record<NotificationType, NotificationCategory> = {
  [NotificationType.Admission]: "admissions",
  [NotificationType.Attendance]: "attendance",
  [NotificationType.Results]: "results",
  [NotificationType.ClassTeacherResultSubmission]: "results",
  [NotificationType.ParentInvitation]: "parents",
  [NotificationType.ParentAccepted]: "parents",
  [NotificationType.ParentChildConfirmation]: "parents",
  [NotificationType.ParentChildConfirmed]: "parents",
  [NotificationType.ParentReviewRequired]: "parents",
  [NotificationType.ParentAccessRevoked]: "parents",
  [NotificationType.Fee]: "fees",
  [NotificationType.General]: "general",
  [NotificationType.AssignmentPublished]: "assignments",
  [NotificationType.AssignmentUpdated]: "assignments",
  [NotificationType.AssignmentSubmitted]: "assignments",
  [NotificationType.AssignmentGraded]: "assignments",
  [NotificationType.CurriculumNote]: "curriculum",
  [NotificationType.CurriculumNoteReply]: "curriculum",
  [NotificationType.GradesSubmitted]: "results",
  [NotificationType.ClassResultsSubmitted]: "results",
  [NotificationType.ResultsReleased]: "results",
  [NotificationType.ResultsUnlocked]: "results",
};

export function getNotificationCategory(
  type: string | NotificationType | undefined,
): NotificationCategory {
  if (!type) {
    return "general";
  }
  return TYPE_TO_CATEGORY[type as NotificationType] ?? "general";
}

export function getNotificationCategoryLabel(
  type: string | NotificationType | undefined,
): string {
  return NOTIFICATION_CATEGORY_LABELS[getNotificationCategory(type)];
}

const TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.Admission]: "Admission",
  [NotificationType.Attendance]: "Attendance",
  [NotificationType.Results]: "Results",
  [NotificationType.ClassTeacherResultSubmission]: "Result submission",
  [NotificationType.ParentInvitation]: "Parent invitation",
  [NotificationType.ParentAccepted]: "Parent accepted",
  [NotificationType.ParentChildConfirmation]: "Child confirmation",
  [NotificationType.ParentChildConfirmed]: "Child confirmed",
  [NotificationType.ParentReviewRequired]: "Parent review",
  [NotificationType.ParentAccessRevoked]: "Access revoked",
  [NotificationType.Fee]: "Fees",
  [NotificationType.General]: "General",
  [NotificationType.AssignmentPublished]: "Assignment published",
  [NotificationType.AssignmentUpdated]: "Assignment updated",
  [NotificationType.AssignmentSubmitted]: "Assignment submitted",
  [NotificationType.AssignmentGraded]: "Assignment graded",
  [NotificationType.CurriculumNote]: "Curriculum note",
  [NotificationType.CurriculumNoteReply]: "Curriculum reply",
  [NotificationType.GradesSubmitted]: "Grades submitted",
  [NotificationType.ClassResultsSubmitted]: "Class results submitted",
  [NotificationType.ResultsReleased]: "Results released",
  [NotificationType.ResultsUnlocked]: "Results unlocked",
};

export function getNotificationTypeLabel(
  type: string | NotificationType | undefined,
): string {
  if (!type) {
    return TYPE_LABELS[NotificationType.General];
  }
  return TYPE_LABELS[type as NotificationType] ?? TYPE_LABELS[NotificationType.General];
}

export function formatRelativeTime(date?: string): string {
  if (!date) {
    return "";
  }

  const then = new Date(date).getTime();
  if (Number.isNaN(then)) {
    return "";
  }

  const diffMs = Date.now() - then;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return "Just now";
  }
  if (diffMs < hour) {
    const minutes = Math.floor(diffMs / minute);
    return `${minutes} min ago`;
  }
  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }
  if (diffMs < 2 * day) {
    return "Yesterday";
  }
  if (diffMs < 7 * day) {
    const days = Math.floor(diffMs / day);
    return `${days} days ago`;
  }

  return new Date(date).toLocaleDateString();
}

export function groupNotificationsByCategory(
  notifications: Notification[],
  categoryOrder: NotificationCategory[] = NOTIFICATION_CATEGORY_ORDER,
): Array<{ category: NotificationCategory; items: Notification[] }> {
  const buckets = new Map<NotificationCategory, Notification[]>();

  for (const notification of notifications) {
    const category = getNotificationCategory(notification.type);
    const list = buckets.get(category) ?? [];
    list.push(notification);
    buckets.set(category, list);
  }

  return categoryOrder.filter((category) =>
    buckets.has(category),
  ).map((category) => ({
    category,
    items: buckets.get(category) ?? [],
  }));
}

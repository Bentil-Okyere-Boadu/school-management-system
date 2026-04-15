/**
 * A topic is overdue when it is not completed, has a planned end date, and that
 * date (YYYY-MM-DD) is strictly before today's local calendar date.
 */
export function isCurriculumTopicOverdue({
  status,
  plannedEndDate,
}: {
  status: "pending" | "completed";
  plannedEndDate: string | null;
}): boolean {
  if (status === "completed" || !plannedEndDate) return false;
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return plannedEndDate < iso;
}

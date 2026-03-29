"use client";

import type { BadgeVariant, Student } from "@/@types";
import Badge from "@/components/common/Badge";
import { capitalizeFirstLetter } from "@/utils/helpers";

function studentStatusToBadge(
  student: Student,
): { text: string; variant: BadgeVariant } {
  const archived =
    student.isArchived ||
    String(student.status ?? "").toLowerCase() === "archived";
  if (archived) {
    return { text: "Archived", variant: "inactive" };
  }
  const raw = String(student.status ?? "").trim().toLowerCase();
  if (raw === "pending") {
    return { text: capitalizeFirstLetter("pending"), variant: "pending" };
  }
  if (raw === "active") {
    return { text: capitalizeFirstLetter("active"), variant: "active" };
  }
  if (raw === "inactive") {
    return {
      text: capitalizeFirstLetter("inactive"),
      variant: "inactive",
    };
  }
  if (!raw) {
    return { text: "—", variant: "gray" };
  }
  return {
    text: capitalizeFirstLetter(student.status ?? ""),
    variant: "gray",
  };
}

/** Same pill style as admin All Users table (`UsersTable` + `Badge`). */
export function StudentStatusBadge({ student }: { student: Student }) {
  const { text, variant } = studentStatusToBadge(student);
  return (
    <div className="flex items-center justify-start">
      <Badge text={text} showDot variant={variant} />
    </div>
  );
}

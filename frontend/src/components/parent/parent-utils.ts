import type { Calendar, Term } from "@/@types";
import type { ParentFinanceChild } from "@/hooks/parent";

export const ALL_CHILDREN_VALUE = "all";

export function getInitials(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.trim()?.[0] ?? "";
  const last = lastName?.trim()?.[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || "—";
}

export function fullName(firstName?: string | null, lastName?: string | null) {
  return `${firstName ?? ""} ${lastName ?? ""}`.trim() || "Ward";
}

export function termOutstanding(
  child: ParentFinanceChild,
  termId?: string,
  termName?: string,
): number {
  const lines = child.feeLines ?? [];
  if (termId) {
    const matched = lines.filter(
      (line) =>
        line.academicTermId === termId ||
        (!line.academicTermId &&
          termName &&
          line.periodLabel?.toLowerCase() === termName.toLowerCase()),
    );
    if (matched.length > 0 || lines.some((line) => line.academicTermId)) {
      return roundMoney(
        matched.reduce((sum, line) => sum + (line.outstanding ?? 0), 0),
      );
    }
  }
  return roundMoney(child.totals?.outstanding ?? 0);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function formatParentDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatRelativeDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function monthLabel(month: number, year: number) {
  return new Date(year, month - 1, 1).toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export function monthOptions(year: number) {
  return Array.from({ length: 12 }, (_, index) => ({
    value: String(index + 1),
    label: new Date(year, index, 1).toLocaleString("en-GB", { month: "long" }),
  }));
}

export function periodValue(month: number, year: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parsePeriodValue(value: string) {
  const [yearPart, monthPart] = value.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }
  return { month, year };
}

export function attendancePeriodOptions(term?: Term, fallbackYear = new Date().getFullYear()) {
  if (term?.startDate && term?.endDate) {
    const start = new Date(term.startDate);
    const end = new Date(term.endDate);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end) {
      const options: Array<{ value: string; label: string }> = [];
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      const last = new Date(end.getFullYear(), end.getMonth(), 1);
      while (cursor <= last) {
        const month = cursor.getMonth() + 1;
        const year = cursor.getFullYear();
        options.push({
          value: periodValue(month, year),
          label: monthLabel(month, year),
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }
      if (options.length) return options;
    }
  }

  return Array.from({ length: 12 }, (_, index) => ({
    value: periodValue(index + 1, fallbackYear),
    label: monthLabel(index + 1, fallbackYear),
  }));
}

export function pickAttendancePeriod(term?: Term) {
  const now = new Date();
  if (term?.startDate && term?.endDate && isDateInTerm(term, now)) {
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }
  if (term?.startDate) {
    const start = new Date(term.startDate);
    if (!Number.isNaN(start.getTime())) {
      return { month: start.getMonth() + 1, year: start.getFullYear() };
    }
  }
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function gradeRemark(grade?: string | null) {
  const value = (grade ?? "").trim().toUpperCase().replace(/\s/g, "");
  if (!value) return "—";
  if (value.startsWith("A")) return "Excellent";
  if (value === "B+") return "Very Good";
  if (value.startsWith("B")) return "Good";
  if (value === "C+") return "Credit";
  if (value.startsWith("C")) return "Satisfactory";
  if (value.startsWith("D")) return "Pass";
  return "Needs Improvement";
}

export function gradeCircleClass(grade?: string | null) {
  const value = (grade ?? "").trim().toUpperCase().replace(/\s/g, "");
  if (value.startsWith("A") || value === "B+") return "bg-emerald-500";
  if (value.startsWith("B")) return "bg-teal-500";
  if (value.startsWith("C")) return "bg-sky-500";
  if (value.startsWith("D")) return "bg-amber-500";
  return "bg-zinc-400";
}

export function overallPerformanceBand(average: number | null) {
  if (average == null) return null;
  if (average >= 80) return "Excellent";
  if (average >= 70) return "Very Good";
  if (average >= 60) return "Good";
  if (average >= 50) return "Credit";
  if (average >= 40) return "Pass";
  return "Needs Improvement";
}

export function performanceBandClass(band: string | null) {
  switch (band) {
    case "Excellent":
    case "Very Good":
      return "bg-emerald-50 text-emerald-700";
    case "Good":
    case "Credit":
      return "bg-teal-50 text-teal-700";
    case "Pass":
      return "bg-amber-50 text-amber-800";
    case "Needs Improvement":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

export function yearOptions(centerYear = new Date().getFullYear()) {
  return [centerYear - 1, centerYear, centerYear + 1].map((year) => ({
    value: String(year),
    label: String(year),
  }));
}

export function pickCurrentCalendar(calendars: Calendar[]): Calendar | undefined {
  if (!calendars.length) return undefined;
  const today = new Date();
  const covering = calendars.find((calendar) =>
    calendar.terms?.some((term) => isDateInTerm(term, today)),
  );
  return covering ?? calendars[calendars.length - 1] ?? calendars[0];
}

export function pickCurrentTerm(calendar?: Calendar): Term | undefined {
  const terms = calendar?.terms ?? [];
  if (!terms.length) return undefined;
  const today = new Date();
  return terms.find((term) => isDateInTerm(term, today)) ?? terms[0];
}

function isDateInTerm(term: Term, date: Date) {
  if (!term.startDate || !term.endDate) return false;
  const start = new Date(term.startDate);
  const end = new Date(term.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return date >= start && date <= end;
}

export function financeHistory(child: ParentFinanceChild): Array<{
  id: string;
  date: string | null;
  method: string;
  amount: number;
}> {
  const rows = Array.isArray(child.history)
    ? child.history
    : child.history?.data ?? [];
  return rows.map((tx) => ({
    id: tx.id,
    date: tx.paymentDate ?? tx.createdAt,
    method: tx.paymentMethod || tx.provider || "Payment",
    amount: tx.amount,
  }));
}

export function normalizeGhanaMsisdn(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `233${digits.slice(1)}`;
  if (digits.length === 9) return `233${digits}`;
  return digits;
}

export function averagePercentage(percentages: Array<string | number | null | undefined>) {
  const values = percentages
    .map((value) => {
      if (typeof value === "number") return value;
      if (typeof value === "string") return Number.parseFloat(value.replace("%", ""));
      return Number.NaN;
    })
    .filter((value) => Number.isFinite(value));
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

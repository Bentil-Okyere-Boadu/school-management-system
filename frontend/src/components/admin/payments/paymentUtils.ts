import {
  FinanceRecentPayment,
  PaymentAppliedFee,
  SchoolPaymentAllocation,
  SchoolPaymentTransaction,
  SchoolPaymentTransactionStatus,
} from "@/@types";

export function formatGHS(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  return v.toFixed(2);
}

/** Currency display for Finance UI: "GHS 1,234.56" */
export function formatGHSCurrency(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  return `GHS ${v.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Prefer YYYY-MM-DD for finance due dates; fall back to em dash. */
export function formatFinanceDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const raw = String(iso).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatPaymentDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatPaymentDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date}, ${time}`;
}

export function maskMobile(mobile: string | null | undefined): string {
  if (!mobile) return "$233XXXXXXX`";
  return mobile;
}

export function statusBadgeClass(
  status: SchoolPaymentTransactionStatus
): string {
  switch (status) {
    case "PAID":
      return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
    case "PENDING":
      return "bg-amber-50 text-amber-900 ring-1 ring-amber-200";
    case "FAILED":
      return "bg-red-50 text-red-800 ring-1 ring-red-200";
    case "REFUNDED":
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
    case "CANCELLED":
    case "UNPAID":
    default:
      return "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200";
  }
}

export function sortedAllocations(
  allocations: SchoolPaymentAllocation[] | undefined
): SchoolPaymentAllocation[] {
  if (!allocations?.length) return [];
  return [...allocations].sort(
    (a, b) => (a.allocationOrder ?? 0) - (b.allocationOrder ?? 0)
  );
}

export function feeLabel(allocation: SchoolPaymentAllocation): string {
  const fs = allocation.feeStructure;
  if (!fs) return "Fee";
  return fs.feeTitle?.trim() || fs.feeType || "Fee";
}

export function paymentPeriodLabel(
  payment: Pick<
    SchoolPaymentTransaction | FinanceRecentPayment,
    "periodLabel" | "appliedFees" | "periodLabels"
  >
): string {
  if (payment.periodLabel?.trim()) {
    return payment.periodLabel.trim();
  }
  if (payment.periodLabels?.length) {
    return payment.periodLabels.join(" · ");
  }
  const applied = payment.appliedFees ?? [];
  const labels = [
    ...new Set(
      applied
        .map((fee) => fee.periodLabel?.trim())
        .filter((label): label is string => Boolean(label && label !== "—"))
    ),
  ];
  return labels.join(" · ");
}

export function paymentAppliedFeesPreview(
  appliedFees: PaymentAppliedFee[] | undefined,
  maxLines = 2
): { lines: string[]; more: number } {
  const list = appliedFees ?? [];
  const lines = list.slice(0, maxLines).map((fee) => fee.feeTitle);
  return { lines, more: Math.max(0, list.length - maxLines) };
}

export function allocationSummaryLine(
  allocation: SchoolPaymentAllocation
): string {
  return `${feeLabel(allocation)} (${formatGHS(allocation.allocatedAmount)})`;
}

export function allocatedToPreview(
  transaction: SchoolPaymentTransaction,
  maxLines = 2
): { lines: string[]; more: number } {
  const list = sortedAllocations(transaction.allocations);
  const lines = list.slice(0, maxLines).map(allocationSummaryLine);
  const more = Math.max(0, list.length - maxLines);
  return { lines, more };
}

export function showNetAmount(status: SchoolPaymentTransactionStatus): boolean {
  return status === "PAID";
}

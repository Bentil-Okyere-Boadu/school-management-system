"use client";

import { formatGHSCurrency } from "@/components/admin/payments/paymentUtils";
import type { ParentOverview } from "@/hooks/parent";
import React from "react";

interface ParentKpiRowProps {
  overview?: ParentOverview;
  termName?: string;
}

function KpiCard({
  label,
  value,
  hint,
  valueClassName = "text-neutral-800",
  hintClassName = "text-zinc-500",
}: {
  label: string;
  value: string;
  hint: string;
  valueClassName?: string;
  hintClassName?: string;
}) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
      <p className="text-xs font-medium tracking-wide text-zinc-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${valueClassName}`}>
        {value}
      </p>
      <p className={`mt-1 text-xs ${hintClassName}`}>{hint}</p>
    </article>
  );
}

export const ParentKpiRow: React.FC<ParentKpiRowProps> = ({
  overview,
  termName,
}) => {
  const overdue = overview?.overdueChildrenCount ?? 0;
  const pending = overview?.pendingActionsCount ?? 0;
  const paidHint = termName ? `${termName} to date` : "Term to date";

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Wards"
        value={String(overview?.childrenCount ?? 0)}
        hint={
          overdue > 0
            ? `${overdue} with overdue fees`
            : "No overdue fees"
        }
        hintClassName={overdue > 0 ? "text-rose-600" : "text-zinc-500"}
      />
      <KpiCard
        label="Fees charged"
        value={formatGHSCurrency(overview?.feesCharged ?? 0)}
        hint="After discounts"
      />
      <KpiCard
        label="Paid"
        value={formatGHSCurrency(overview?.totalPaid ?? 0)}
        hint={paidHint}
        valueClassName="text-purple-500"
      />
      <KpiCard
        label="Outstanding"
        value={formatGHSCurrency(overview?.outstanding ?? 0)}
        hint={
          pending > 0
            ? `${pending} pending action(s)`
            : "No pending actions"
        }
        valueClassName="text-teal-600"
      />
    </div>
  );
};

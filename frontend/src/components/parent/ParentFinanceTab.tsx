"use client";

import { formatGHSCurrency } from "@/components/admin/payments/paymentUtils";
import CustomButton from "@/components/Button";
import { ParentChildHeader } from "@/components/parent/ParentChildHeader";
import { ParentEmptyChildren } from "@/components/parent/ParentEmptyChildren";
import { financeHistory, formatParentDate } from "@/components/parent/parent-utils";
import type { ParentFinanceChild } from "@/hooks/parent";
import { IconClock, IconDownload, IconWallet } from "@tabler/icons-react";
import { HashLoader } from "react-spinners";
import React from "react";

interface ParentFinanceTabProps {
  childrenCount: number;
  childrenLoading: boolean;
  finance: ParentFinanceChild[];
  isLoading: boolean;
  onPay: (studentId?: string) => void;
  onReceipt: (studentId: string, transactionId: string) => void;
}

export const ParentFinanceTab: React.FC<ParentFinanceTabProps> = ({
  childrenCount,
  childrenLoading,
  finance,
  isLoading,
  onPay,
  onReceipt,
}) => {
  if (!childrenCount) {
    return childrenLoading ? <TabLoader /> : <ParentEmptyChildren />;
  }

  if (isLoading && finance.length === 0) {
    return <TabLoader />;
  }

  return (
    <div className="space-y-4">
      {finance.map((child) => (
        <FinanceCard
          key={child.studentId}
          child={child}
          onPay={() => onPay(child.studentId)}
          onReceipt={(transactionId) => onReceipt(child.studentId, transactionId)}
        />
      ))}
    </div>
  );
};

function FinanceCard({
  child,
  onPay,
  onReceipt,
}: {
  child: ParentFinanceChild;
  onPay: () => void;
  onReceipt: (transactionId: string) => void;
}) {
  const outstanding = child.totals?.outstanding ?? 0;
  const history = financeHistory(child);
  const upcoming = child.upcoming ?? [];

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5">
      <ParentChildHeader
        firstName={child.firstName}
        lastName={child.lastName}
        grade={child.grade}
        studentCode={child.studentCode}
        photoUrl={child.photoUrl}
        divider
        actions={
          <>
            {child.totals?.nextDueDate ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800">
                <IconClock size={14} />
                Due {formatParentDate(child.totals.nextDueDate)}
              </span>
            ) : null}
            {outstanding > 0 ? (
              <CustomButton
                text="Pay"
                icon={<IconWallet size={16} />}
                onClick={onPay}
                className="py-[4px] px-[8px]"
              />
            ) : null}
          </>
        }
      />

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Fee breakdown
          </h3>
          <div className="rounded-[10px] border border-slate-200 bg-slate-50 px-5 py-4">
            {(child.feeLines ?? []).length ? (
              <ul className="space-y-2.5">
                {(child.feeLines ?? []).map((line) => (
                  <li
                    key={line.obligationId}
                    className="flex items-start justify-between gap-3 text-sm text-slate-500"
                  >
                    <span>
                      {line.feeTitle}
                      {line.periodLabel ? ` — ${line.periodLabel}` : ""}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {formatGHSCurrency(line.amountDue)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No fee lines yet.</p>
            )}

            <div className="mt-4 space-y-2.5 border-t border-slate-200 pt-3 text-sm">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>Total charged</span>
                <span className="tabular-nums">
                  {formatGHSCurrency(child.totals?.totalPayable)}
                </span>
              </div>
              <div className="flex justify-between text-slate-800">
                <span>Paid</span>
                <span className="tabular-nums text-emerald-600">
                  {formatGHSCurrency(child.totals?.totalPaid)}
                </span>
              </div>
            </div>

            <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-sm font-semibold text-slate-800">
              <span>Outstanding</span>
              <span className="tabular-nums text-rose-400">
                {formatGHSCurrency(outstanding)}
              </span>
            </div>
          </div>
        </section>

        <div className="space-y-5">
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Payment history
            </h3>
            {history.length ? (
              <ul className="space-y-2">
                {history.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-[10px] border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm"
                  >
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 text-slate-500">
                        {formatParentDate(row.date)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-slate-600">
                            {row.method}
                          </span>
                          {row.periodLabel ? (
                            <span className="inline-flex max-w-full truncate rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-800 ring-1 ring-violet-100">
                              {row.periodLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <span className="shrink-0 tabular-nums font-semibold text-slate-800">
                        {formatGHSCurrency(row.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onReceipt(row.id)}
                        className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                        aria-label="Download receipt"
                      >
                        <IconDownload size={16} stroke={1.6} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-[10px] border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm text-slate-400">
                No payments yet.
              </p>
            )}
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Upcoming
            </h3>
            {upcoming.length ? (
              <ul className="space-y-2">
                {upcoming.map((item, index) => (
                  <li
                    key={`${item.label}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-[10px] border border-slate-200 bg-slate-50 px-5 py-3.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {item.label || "Term balance"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Due {formatParentDate(item.dueDate)}
                        {item.overdue ? " · Overdue" : ""}
                      </p>
                    </div>
                    <span className="shrink-0 tabular-nums text-sm font-semibold text-slate-800">
                      {formatGHSCurrency(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-[10px] border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm text-slate-400">
                No upcoming dues.
              </p>
            )}
          </section>
        </div>
      </div>
    </article>
  );
}

function TabLoader() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <HashLoader color="#AB58E7" size={40} />
    </div>
  );
}

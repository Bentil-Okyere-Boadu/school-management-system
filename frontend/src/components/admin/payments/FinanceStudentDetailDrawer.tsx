"use client";

import { IconX } from "@tabler/icons-react";
import React, { useEffect, useMemo, useState } from "react";
import { HashLoader } from "react-spinners";
import { Pagination } from "@/components/common/Pagination";
import { useGetFinanceStudentDetail } from "@/hooks/school-admin";
import {
  formatFinanceDate,
  formatGHSCurrency,
  formatPaymentDate,
  paymentAppliedFeesPreview,
  statusBadgeClass,
} from "./paymentUtils";
import type { SchoolPaymentTransactionStatus } from "@/@types";

interface FinanceStudentDetailDrawerProps {
  studentId: string | null;
  calendarId: string;
  termId: string;
  periodLabel?: string;
  onClose: () => void;
}

function MiniMetric({
  label,
  value,
  valueClassName = "text-zinc-900",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-3">
      <p className="text-xs tracking-wide text-zinc-500">{label}</p>
      <p
        className={`mt-1.5 text-sm font-semibold tabular-nums ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}

function PeriodBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex max-w-[220px] truncate rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-800 ring-1 ring-violet-100">
      {label}
    </span>
  );
}

export const FinanceStudentDetailDrawer: React.FC<
  FinanceStudentDetailDrawerProps
> = ({ studentId, calendarId, termId, periodLabel, onClose }) => {
  const paymentLimit = 15;
  const [paymentPage, setPaymentPage] = useState(1);

  useEffect(() => {
    setPaymentPage(1);
  }, [studentId, calendarId, termId]);

  const filters = useMemo(
    () => ({
      academicCalendarId: calendarId || undefined,
      academicTermId: termId || undefined,
      paymentPage,
      paymentLimit,
    }),
    [calendarId, termId, paymentPage]
  );

  const { detail, isLoading } = useGetFinanceStudentDetail(
    studentId,
    Boolean(studentId) && Boolean(termId),
    filters
  );

  if (!studentId) return null;

  const student = detail?.student;
  const totals = detail?.totals;
  const name = student
    ? `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim()
    : "";
  const subtitle = student
    ? `${student.studentCode ?? "—"}${
        student.className ? ` · ${student.className}` : ""
      }`
    : "";

  const net = totals?.netBalance ?? 0;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 print:hidden"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-[760px] flex-col bg-[#F9FAFC] shadow-xl print:hidden">
        <div className="flex items-start justify-between border-b border-zinc-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-zinc-900">
              {isLoading && !detail ? "Student finance" : name || "Student finance"}
            </h2>
            <p className="mt-0.5 truncate text-sm text-zinc-500">{subtitle}</p>
            {periodLabel ? (
              <p className="mt-2">
                <PeriodBadge label={periodLabel} />
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 cursor-pointer"
            aria-label="Close"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="relative flex-1 overflow-y-auto px-5 py-5">
          {isLoading && !detail && (
            <div className="flex min-h-[200px] items-center justify-center">
              <HashLoader color="#AB58E7" size={40} />
            </div>
          )}

          {detail && totals && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <MiniMetric
                  label="Payable"
                  value={formatGHSCurrency(totals.totalPayable)}
                />
                <MiniMetric
                  label="Paid"
                  value={formatGHSCurrency(totals.totalPaid)}
                  valueClassName="text-emerald-600"
                />
                <MiniMetric
                  label="Outstanding"
                  value={formatGHSCurrency(totals.outstanding)}
                  valueClassName="text-amber-600"
                />
                <MiniMetric
                  label="Arrears"
                  value={formatGHSCurrency(totals.arrears)}
                  valueClassName={
                    totals.arrears > 0 ? "text-red-600" : "text-zinc-900"
                  }
                />
                <MiniMetric
                  label="Prepayment"
                  value={formatGHSCurrency(totals.prepayment)}
                  valueClassName={
                    totals.prepayment > 0 ? "text-emerald-600" : "text-zinc-900"
                  }
                />
                <MiniMetric
                  label="Net balance"
                  value={formatGHSCurrency(net)}
                  valueClassName={
                    net > 0 ? "text-red-600" : "text-emerald-600"
                  }
                />
              </div>

              <section className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-zinc-900">
                  Fee lines
                </h3>
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50">
                          <th className="px-3 py-2.5 font-medium text-zinc-600">
                            Fee
                          </th>
                          <th className="px-3 py-2.5 font-medium text-zinc-600 text-right">
                            Due
                          </th>
                          <th className="px-3 py-2.5 font-medium text-zinc-600 text-right">
                            Paid
                          </th>
                          <th className="px-3 py-2.5 font-medium text-zinc-600 text-right">
                            Outstanding
                          </th>
                          <th className="px-3 py-2.5 font-medium text-zinc-600">
                            Due date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.feeLines.map((line) => (
                          <tr
                            key={line.obligationId}
                            className="border-b border-zinc-100 last:border-0"
                          >
                            <td className="px-3 py-2.5 font-medium text-zinc-900">
                              {line.feeTitle}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-zinc-800">
                              {formatGHSCurrency(line.amountDue)}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-zinc-800">
                              {formatGHSCurrency(line.paid)}
                            </td>
                            <td
                              className={`px-3 py-2.5 text-right tabular-nums ${
                                line.outstanding > 0
                                  ? "text-amber-600"
                                  : "text-zinc-800"
                              }`}
                            >
                              {formatGHSCurrency(line.outstanding)}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-zinc-700">
                              {formatFinanceDate(line.dueDate)}
                            </td>
                          </tr>
                        ))}
                        {detail.feeLines.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-3 py-8 text-center text-zinc-500"
                            >
                              No fee lines for this period.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <section className="mt-6">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Payment history
                  </h3>
                  {detail.paymentMeta && detail.paymentMeta.total > 0 ? (
                    <p className="text-xs text-zinc-500">
                      Showing{" "}
                      {(detail.paymentMeta.page - 1) * detail.paymentMeta.limit +
                        1}
                      –
                      {Math.min(
                        detail.paymentMeta.page * detail.paymentMeta.limit,
                        detail.paymentMeta.total
                      )}{" "}
                      of {detail.paymentMeta.total}
                    </p>
                  ) : null}
                </div>
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50">
                          <th className="px-3 py-2.5 font-medium text-zinc-600">
                            Date
                          </th>
                          <th className="px-3 py-2.5 font-medium text-zinc-600">
                            Applied to
                          </th>
                          <th className="px-3 py-2.5 font-medium text-zinc-600">
                            Channel
                          </th>
                          <th className="px-3 py-2.5 font-medium text-zinc-600">
                            Status
                          </th>
                          <th className="px-3 py-2.5 font-medium text-zinc-600 text-right">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.recentPayments.map((payment) => {
                          const preview = paymentAppliedFeesPreview(
                            payment.appliedFees
                          );
                          return (
                            <tr
                              key={payment.id}
                              className="border-b border-zinc-100 last:border-0"
                            >
                              <td className="px-3 py-2.5 whitespace-nowrap text-zinc-700 align-top">
                                {formatPaymentDate(payment.date)}
                              </td>
                              <td className="px-3 py-2.5 align-top">
                                {preview.lines.length > 0 ? (
                                  <div className="space-y-0.5">
                                    {preview.lines.map((line) => (
                                      <p
                                        key={line}
                                        className="text-xs text-zinc-600"
                                      >
                                        {line}
                                      </p>
                                    ))}
                                    {preview.more > 0 ? (
                                      <p className="text-xs text-zinc-400">
                                        +{preview.more} more fee
                                        {preview.more === 1 ? "" : "s"}
                                      </p>
                                    ) : null}
                                  </div>
                                ) : (
                                  <span className="text-zinc-400">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-zinc-700 align-top">
                                {payment.channel || "—"}
                              </td>
                              <td className="px-3 py-2.5 align-top">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${statusBadgeClass(
                                    payment.status as SchoolPaymentTransactionStatus
                                  )}`}
                                >
                                  {payment.status}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-right font-medium tabular-nums text-zinc-900 align-top">
                                {formatGHSCurrency(payment.amount)}
                              </td>
                            </tr>
                          );
                        })}
                        {detail.recentPayments.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-3 py-8 text-center text-zinc-500"
                            >
                              No payments recorded for this period.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {detail.paymentMeta && detail.paymentMeta.totalPages > 1 ? (
                  <div className="mt-3">
                    <Pagination
                      currentPage={paymentPage}
                      totalPages={detail.paymentMeta.totalPages}
                      onPageChange={setPaymentPage}
                    />
                  </div>
                ) : null}
              </section>

              <p className="mt-5 text-xs leading-relaxed text-zinc-500">
                Overpayments become prepayment credit and reduce future term
                fees. Unpaid prior periods remain as arrears.
              </p>
            </>
          )}
        </div>
      </aside>
    </div>
  );
};

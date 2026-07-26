"use client";

import { IconX } from "@tabler/icons-react";
import React from "react";
import { HashLoader } from "react-spinners";
import { useGetFinanceStudentDetail } from "@/hooks/school-admin";
import {
  formatFinanceDate,
  formatGHSCurrency,
  formatPaymentDate,
  statusBadgeClass,
} from "./paymentUtils";
import type { SchoolPaymentTransactionStatus } from "@/@types";

interface FinanceStudentDetailDrawerProps {
  studentId: string | null;
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

export const FinanceStudentDetailDrawer: React.FC<
  FinanceStudentDetailDrawerProps
> = ({ studentId, onClose }) => {
  const { detail, isLoading } = useGetFinanceStudentDetail(
    studentId,
    Boolean(studentId)
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
      <aside className="relative flex h-full w-full max-w-[722px] flex-col bg-[#F9FAFC] shadow-xl print:hidden">
        <div className="flex items-start justify-between border-b border-zinc-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-zinc-900">
              {isLoading && !detail ? "Student finance" : name || "Student finance"}
            </h2>
            <p className="mt-0.5 truncate text-sm text-zinc-500">{subtitle}</p>
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
                    <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50">
                          <th className="px-3 py-2.5 font-medium text-zinc-600">
                            Fee
                          </th>
                          <th className="px-3 py-2.5 font-medium text-zinc-600">
                            Period
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
                            <td className="px-3 py-2.5 text-zinc-700">
                              {line.periodLabel || "—"}
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
                              colSpan={6}
                              className="px-3 py-8 text-center text-zinc-500"
                            >
                              No fee lines for this student.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <section className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-zinc-900">
                  Payment history
                </h3>
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50">
                          <th className="px-3 py-2.5 font-medium text-zinc-600">
                            Date
                          </th>
                          <th className="px-3 py-2.5 font-medium text-zinc-600">
                            Student
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
                        {detail.recentPayments.map((payment) => (
                          <tr
                            key={payment.id}
                            className="border-b border-zinc-100 last:border-0"
                          >
                            <td className="px-3 py-2.5 whitespace-nowrap text-zinc-700">
                              {formatPaymentDate(payment.date)}
                            </td>
                            <td className="px-3 py-2.5 text-zinc-800">
                              {payment.studentName || name}
                            </td>
                            <td className="px-3 py-2.5 text-zinc-700">
                              {payment.channel || "—"}
                            </td>
                            <td className="px-3 py-2.5">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${statusBadgeClass(
                                  payment.status as SchoolPaymentTransactionStatus
                                )}`}
                              >
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium tabular-nums text-zinc-900">
                              {formatGHSCurrency(payment.amount)}
                            </td>
                          </tr>
                        ))}
                        {detail.recentPayments.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-3 py-8 text-center text-zinc-500"
                            >
                              No Hubtel payments recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
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

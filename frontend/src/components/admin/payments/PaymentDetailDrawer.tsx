"use client";

import { SchoolPaymentTransaction } from "@/@types";
import {
  IconClock ,
  IconChevronDown,
  IconChevronUp,
  IconFileText,
  IconX,
} from "@tabler/icons-react";
import React, { useMemo, useState } from "react";
import {
  feeLabel,
  formatGHS,
  formatPaymentDate,
  formatPaymentDateTime,
  maskMobile,
  sortedAllocations,
  statusBadgeClass,
} from "./paymentUtils";

interface PaymentDetailDrawerProps {
  transaction: SchoolPaymentTransaction | null;
  onClose: () => void;
  onViewReceipt: (transactionId: string) => void;
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-zinc-500">{label}</span>
      <div className="text-right font-medium text-zinc-900">{children}</div>
    </div>
  );
}

export const PaymentDetailDrawer: React.FC<PaymentDetailDrawerProps> = ({
  transaction,
  onClose,
  onViewReceipt,
}) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const studentName = useMemo(() => {
    if (!transaction?.student) return "";
    const s = transaction.student;
    return `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim();
  }, [transaction]);

  if (!transaction) return null;

  const displayDate =
    transaction.paymentDate || transaction.createdAt;
  const canReceipt =
    transaction.status === "PAID" && Boolean(transaction.receipt);

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 print:hidden"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-[#F9FAFC] shadow-xl print:hidden">
        <div className="flex items-start justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              Payment Details
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              {studentName} · {formatPaymentDate(displayDate)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 cursor-pointer"
            aria-label="Close"
          >
            <IconX size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          <section>
            <h3 className="mb-3 text-sm font-semibold text-zinc-900">
              Summary
            </h3>
            <div className="rounded-xl bg-[#F4F7FA] px-4 py-4 space-y-3">
              <SummaryRow label="Status">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${statusBadgeClass(
                    transaction.status
                  )}`}
                >
                  {transaction.status}
                </span>
              </SummaryRow>
              <SummaryRow label="Date">
                {formatPaymentDateTime(displayDate)}
              </SummaryRow>
              <SummaryRow label="Mobile">
                {maskMobile(transaction.mobile)}
              </SummaryRow>

              <div className="border-t border-zinc-200/90 pt-3 space-y-3">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-zinc-500">Gross amount</span>
                  <span className="font-semibold text-zinc-900 tabular-nums">
                    GHS {formatGHS(transaction.amount)}
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-zinc-500">Charges</span>
                  <span className="text-zinc-500 tabular-nums">
                    − GHS {formatGHS(transaction.charges)}
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-sm pt-0.5">
                  <span className="text-zinc-500">Net received</span>
                  <span className="font-semibold text-zinc-900 tabular-nums">
                    GHS {formatGHS(transaction.amountAfterCharges)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {transaction.status === 'PENDING' && (
            <div
              role="alert"
              className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950"
            >
              <IconClock 
                className="mt-0.5 shrink-0 text-amber-700"
                size={20}
                stroke={1.75}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-sm leading-relaxed text-amber-900/90">
                  Awaiting payment confirmation from provider.
                </p>
              </div>
            </div>
          )}

          <section>
            <h3 className="mb-3 text-sm font-semibold text-zinc-900">
              Applied to fees
            </h3>
            <div className="overflow-hidden rounded-lg border border-zinc-200">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-[#F4F7FA]">
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-zinc-500">
                      Fee
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-zinc-500">
                      Amount (GHS)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAllocations(transaction.allocations).map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-zinc-100 last:border-b-0"
                    >
                      <td className="px-3 py-2 text-zinc-800 align-top">
                        {feeLabel(a)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums align-top">
                        {formatGHS(a.allocatedAmount)} GHS
                      </td>
                    </tr>
                  ))}
                  {(!transaction.allocations ||
                    transaction.allocations.length === 0) && (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-3 py-4 text-center text-zinc-500"
                      >
                        No allocation lines
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {transaction.receipt && (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-zinc-900">
                Receipt
              </h3>
              <div className="rounded-xl bg-[#F4F7FA] px-4 py-4">
                <dl className="space-y-2.5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Receipt #</dt>
                    <dd className="text-right text-zinc-500">
                      {transaction.receipt.receiptNumber}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Issued</dt>
                    <dd className="text-right text-zinc-500">
                      {formatPaymentDateTime(transaction.receipt.issuedAt)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Amount</dt>
                    <dd className="text-right font-semibold text-zinc-900 tabular-nums">
                      GHS {formatGHS(transaction.receipt.amount)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 border-t border-zinc-200/90 pt-4">
                  <button
                    type="button"
                    disabled={!canReceipt}
                    onClick={() => onViewReceipt(transaction.id)}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50"
                  >
                    <IconFileText size={18} className="text-zinc-600" />
                    <p className="text-sm">View Official Receipt</p>
                    
                  </button>
                </div>
              </div>
            </section>
          )}

          <section>
            <button
              type="button"
              onClick={() => setAdvancedOpen((o) => !o)}
              className="mb-3 flex gap-2 w-full items-center cursor-pointer"
            >
              {advancedOpen ? (
                <IconChevronUp size={20} className="shrink-0 text-zinc-500" />
              ) : (
                <IconChevronDown size={20} className="shrink-0 text-zinc-500" />
              )}
              <span className="text-sm font-semibold text-zinc-900">
                Advanced Details
              </span>
            </button>
            {advancedOpen ? (
              <div className="rounded-xl bg-[#F4F7FA] px-4 py-4 text-sm">
                <div className="space-y-3">
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-500">Session ID</span>
                    <span className="max-w-[65%] text-right font-mono text-xs text-zinc-900 break-all">
                      {transaction.sessionId}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-500">Order ID</span>
                    <span className="max-w-[65%] text-right font-mono text-xs text-zinc-900 break-all">
                      {transaction.orderId ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-500">Provider</span>
                    <span className="text-right font-medium text-zinc-900">
                      {transaction.provider}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-500">Provider Status</span>
                    <span className="text-right font-medium text-zinc-900">
                      {transaction.providerStatus ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-500">Target Fee ID</span>
                    <span className="max-w-[65%] text-right font-mono text-xs text-zinc-900 break-all">
                      {transaction.targetFeeStructureId ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-500">Fulfilled</span>
                    <span className="text-right font-medium text-zinc-900">
                      {transaction.isFulfilled ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p></p>
            )
            }
          </section>
        </div>
      </aside>
    </div>
  );
};

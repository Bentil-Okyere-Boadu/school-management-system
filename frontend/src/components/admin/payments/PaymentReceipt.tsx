"use client";

import { useGetSchoolPaymentReceipt } from "@/hooks/school-admin";
import { useParentPaymentReceipt } from "@/hooks/parent";
import { useGetMyPaymentReceipt } from "@/hooks/student";
import {
  IconArrowLeft,
  IconFileDownload,
} from "@tabler/icons-react";
import React, { useCallback } from "react";
import {
  feeLabel,
  formatGHS,
  formatPaymentDateTime,
  maskMobile,
  sortedAllocations,
} from "./paymentUtils";

export type PaymentReceiptVariant = "overlay" | "page";

interface PaymentReceiptProps {
  transactionId: string | null;
  open: boolean;
  onClose: () => void;
  /** `page` = in-flow detail view (route); `overlay` = full-viewport stack above the app */
  variant?: PaymentReceiptVariant;
  /** Student portal uses `/payments/me/.../receipt` instead of the school admin receipt endpoint */
  studentPortal?: boolean;
  /** Parent portal uses `/parent/children/:studentId/receipts/:transactionId` */
  parentPortal?: boolean;
  studentId?: string | null;
}

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({
  transactionId,
  open,
  onClose,
  variant = "overlay",
  studentPortal = false,
  parentPortal = false,
  studentId = null,
}) => {
  const shouldFetch =
    Boolean(transactionId) && (variant === "page" || open);

  const adminReceipt = useGetSchoolPaymentReceipt(
    transactionId,
    shouldFetch && !studentPortal && !parentPortal
  );
  const myReceipt = useGetMyPaymentReceipt(
    transactionId,
    shouldFetch && studentPortal
  );
  const parentReceipt = useParentPaymentReceipt(
    studentId ?? null,
    transactionId,
    shouldFetch && parentPortal
  );

  const receipt = parentPortal
    ? parentReceipt.receipt
    : studentPortal
      ? myReceipt.receipt
      : adminReceipt.receipt;
  const isLoading = parentPortal
    ? parentReceipt.isLoading
    : studentPortal
      ? myReceipt.isLoading
      : adminReceipt.isLoading;
  const isFetching = parentPortal
    ? parentReceipt.isFetching
    : studentPortal
      ? myReceipt.isFetching
      : adminReceipt.isFetching;

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (variant === "overlay" && !open) return null;
  if (!transactionId) return null;

  const tx = receipt?.transaction;
  const school = receipt?.school;
  const student = receipt?.student;
  const allocations = sortedAllocations(tx?.allocations);

  const rootClass =
    variant === "overlay"
      ? "fixed inset-0 z-[70] flex flex-col bg-zinc-100 print:static print:inset-auto print:bg-white"
      : "flex min-h-full flex-col bg-zinc-100 print:bg-white";

  return (
    <div id="payment-receipt-print-root" className={rootClass}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 print:hidden mx-auto max-w-5xl w-full">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 hover:text-zinc-900 cursor-pointer"
        >
          <IconArrowLeft size={18} />
          Back
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#AB58E7] px-3 py-2 text-sm font-medium text-white hover:opacity-95 cursor-pointer"
          >
            <IconFileDownload size={18} />
            Download PDF
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {(isLoading || isFetching) && (
          <div className="mx-auto max-w-2xl rounded-xl bg-white p-12 text-center text-zinc-500 print:hidden">
            Loading receipt…
          </div>
        )}

        {!isLoading && !receipt && (
          <div className="mx-auto max-w-2xl rounded-xl bg-white p-12 text-center text-red-600 print:hidden">
            Receipt could not be loaded.
          </div>
        )}

        {receipt && tx && school && student && (
          <div className="mx-auto max-w-2xl rounded-xl border border-zinc-200 bg-white p-6 shadow-sm print:shadow-none print:border-0">
            <header className="flex flex-col gap-4 border-b border-zinc-100 pb-4 sm:flex-row sm:justify-between">
              <div>
                <h1 className="text-lg font-bold text-zinc-900">{school.name}</h1>
                <p className="text-sm text-zinc-600">{school.address}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  School code: {school.schoolCode}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                  Payment receipt
                </p>
                <p className="mt-1 font-semibold text-zinc-900">
                  {receipt.receiptNumber}
                </p>
                <p className="text-zinc-600">
                  {formatPaymentDateTime(receipt.issuedAt)}
                </p>
              </div>
            </header>

            {tx.status === "PAID" && (
              <p className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-700">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                  ✓
                </span>
                Payment received and confirmed
              </p>
            )}

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <h2 className="text-xs font-semibold uppercase text-zinc-500">
                  Paid for
                </h2>
                <p className="mt-1 font-semibold text-zinc-900">
                  {student.firstName} {student.lastName}
                </p>
                <p className="text-sm text-zinc-600">
                  Transaction ref: {student.studentId}
                </p>
                <p className="text-sm text-zinc-600">
                  Student code: {student.studentId}
                </p>
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase text-zinc-500">
                  Payment method
                </h2>
                <p className="mt-1 font-semibold text-zinc-900">
                  {tx.paymentMethod ?? "—"}
                </p>
                <p className="text-sm text-zinc-600">
                  Phone: {maskMobile(tx.mobile)}
                </p>
                <p className="text-sm text-zinc-600 capitalize">
                  Via {tx.provider}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="mb-2 text-xs font-semibold uppercase text-zinc-500">
                Applied to fees
              </h2>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                    <th className="py-2 pr-2 font-medium">Fee</th>
                    <th className="py-2 text-right font-medium">Amount (GHS)</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((a) => (
                    <tr key={a.id} className="border-b border-zinc-100">
                      <td className="py-2 pr-2">
                        <span className="font-medium text-zinc-900">
                          {feeLabel(a)}
                        </span>
                        {a.feeStructure?.feeType && (
                          <span className="block text-xs text-zinc-500">
                            {a.feeStructure.feeType}
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right tabular-nums font-medium">
                        {formatGHS(a.allocatedAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end border-t border-zinc-200 pt-4">
              <dl className="w-full max-w-xs space-y-1 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-600">Gross amount</dt>
                  <dd className="font-semibold tabular-nums">
                    GHS {formatGHS(tx.amount)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-600">Charges</dt>
                  <dd className="font-semibold tabular-nums">
                    − GHS {formatGHS(tx.charges)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-zinc-200 pt-2 text-base">
                  <dt className="font-medium text-zinc-800">Net received</dt>
                  <dd className="font-bold tabular-nums">
                    GHS {formatGHS(tx.amountAfterCharges)}
                  </dd>
                </div>
              </dl>
            </div>

            <footer className="mt-8 border-t border-zinc-100 pt-4 text-center text-xs text-zinc-500">
              <p>
                This is an electronically generated receipt and does not require
                a signature.
              </p>
              <p className="mt-2 font-mono text-[11px] text-zinc-400">
                Reference: {tx.sessionId}
                {tx.orderId ? ` · Order ${tx.orderId}` : ""}
              </p>
              <p className="mt-2 font-medium text-zinc-600">{school.name}</p>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
};

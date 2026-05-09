"use client";

import { SchoolPaymentTransaction } from "@/@types";
import { PaymentDetailDrawer } from "@/components/admin/payments/PaymentDetailDrawer";
import {
  allocationSummaryLine,
  formatGHS,
  formatPaymentDate,
  sortedAllocations,
  statusBadgeClass,
} from "@/components/admin/payments/paymentUtils";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import { Pagination } from "@/components/common/Pagination";
import { SearchBar } from "@/components/common/SearchBar";
import { useDebouncer } from "@/hooks/generalHooks";
import { useGetMyPayments, useStudentGetMe } from "@/hooks/student";
import {
  IconCircleCheck,
  IconCopy,
  IconEye,
  IconFileText,
  IconHash,
  IconPhone,
  IconSparkles,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { HashLoader } from "react-spinners";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PAGE_SIZE = 10;

function CopyFieldButton({ value, label }: Readonly<{ value: string; label: string }>) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-800 cursor-pointer"
      title={copied ? "Copied" : `Copy ${label}`}
    >
      <IconCopy size={20} stroke={1.5} />
    </button>
  );
}

type PayStepCardProps = {
  stepLabel: string;
  subLabel: string;
  value: string;
  copyValue: string;
  icon: React.ReactNode;
  iconWellClass: string;
  copyLabel: string;
};

function PayStepCard({
  stepLabel,
  subLabel,
  value,
  copyValue,
  icon,
  iconWellClass,
  copyLabel,
}: Readonly<PayStepCardProps>) {
  return (
    <div className="flex items-center min-h-[100px] flex-1 gap-3 rounded-xl border border-zinc-200/80 bg-white p-5">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconWellClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="text-[11px] font-medium uppercase leading-snug tracking-wide text-zinc-500">
          {stepLabel}
        </p>
        <p className="mt-0.5 text-xs font-normal text-zinc-500">{subLabel}</p>
        <p className="mt-2 font-mono text-sm font-semibold tracking-tight text-zinc-900">
          {value}
        </p>
      </div>
      <CopyFieldButton value={copyValue} label={copyLabel} />
    </div>
  );
}

export const StudentMyPaymentsContent: React.FC = () => {
  const router = useRouter();
  const { me } = useStudentGetMe();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [feeFilter, setFeeFilter] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [drawerTx, setDrawerTx] = useState<SchoolPaymentTransaction | null>(
    null
  );

  const debouncedSearch = useDebouncer(searchQuery);

  useEffect(() => {
    if (feeFilter && debouncedSearch.trim()) setFeeFilter("");
  }, [debouncedSearch, feeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, feeFilter, debouncedSearch]);

  const searchOnly = debouncedSearch.trim();

  const { transactions, meta, summary, filters, isLoading } = useGetMyPayments({
    page: currentPage,
    limit: PAGE_SIZE,
    search: searchOnly,
    status: selectedStatus,
    ...(feeFilter ? { feeStructureId: feeFilter } : {}),
  });

  const totalPages = meta?.totalPages ?? 1;
  const resultCount = meta?.total ?? 0;

  const ussdShortCode = "*713*3088#";

  const feeOptions = useMemo(() => {
    const types = filters?.feeTypes ?? [];
    const opts = types.map((ft) => ({
      value: ft.id,
      label: ft.title.trim() || "Fee",
    }));
    return [{ value: "", label: "All fees" }, ...opts];
  }, [filters?.feeTypes]);

  const subtitle = useMemo(() => {
    const name = `${me?.firstName ?? ""} ${me?.lastName ?? ""}`.trim();
    const schoolName = me?.school?.name ?? "";
    if (!name && !schoolName) return "";
    if (!schoolName) return name;
    if (!name) return schoolName;
    return `${name} · ${schoolName}`;
  }, [me]);

  const totalPaidDisplay = formatGHS(summary?.totalPaidAmountGhs ?? 0);
  const transactionsCount = summary?.totalTransactions ?? meta?.total ?? 0;
  const pendingCount = summary?.pendingCount ?? 0;

  const openDrawer = (tx: SchoolPaymentTransaction) => setDrawerTx(tx);
  const closeDrawer = () => setDrawerTx(null);

  const openReceipt = (transactionId: string) => {
    setDrawerTx(null);
    router.push(`/student/payments/receipt/${transactionId}`);
  };

  return (
    <div className="pb-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">My Payments</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        )}
      </header>

      <section className="mb-6 rounded-2xl border border-violet-200/80 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-4 shadow-sm">
        <div className="mb-3 flex gap-3">
          <IconSparkles
            className="mt-0.5 shrink-0 text-violet-600"
            size={22}
            stroke={1.5}
          />
          <div className="min-w-0">
            <h2 className="text-lg font-bold leading-tight text-zinc-900">
              How to pay your school fees
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">
              Dial the short code from any mobile money line and follow the
              prompts.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <PayStepCard
            stepLabel="Step 1 — Dial this"
            subLabel="USSD short code"
            value={ussdShortCode}
            copyValue={ussdShortCode}
            copyLabel="USSD code"
            iconWellClass="bg-zinc-100 text-zinc-600"
            icon={<IconPhone size={22} stroke={1.5} />}
          />
          <PayStepCard
            stepLabel="Step 2 — Enter when prompted"
            subLabel="Student billing code"
            value={me?.studentBillingCode ?? "—"}
            copyValue={me?.studentBillingCode ?? ""}
            copyLabel="Student billing code"
            iconWellClass="bg-zinc-100 text-zinc-600"
            icon={<IconHash size={22} stroke={1.5} />}
          />
          <PayStepCard
            stepLabel="Step 3 — Identifies you"
            subLabel="Your student code"
            value={me?.studentId ?? "—"}
            copyValue={me?.studentId ?? ""}
            copyLabel="Student code"
            iconWellClass="bg-violet-100 text-violet-700"
            icon={<IconCircleCheck size={22} stroke={1.5} />}
          />
        </div>

        <p className="mt-3 text-xs leading-relaxed text-zinc-500">
          You will receive an approval prompt on your mobile money number to
          complete the payment.
        </p>
      </section>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm tracking-wide text-zinc-500">
            Total paid (GHS)
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-zinc-900">
            {totalPaidDisplay}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm tracking-wide text-zinc-500">Transactions</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-zinc-900">
            {transactionsCount}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm tracking-wide text-zinc-500">Pending</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-amber-600">
            {pendingCount}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <SearchBar
          value={searchQuery}
          onSearch={(q) => {
            setSearchQuery(q);
            if (q.trim()) setFeeFilter("");
          }}
          placeholder="Search receipt, fee..."
          className="w-[366px] ml-1"
        />
        <div>
          <CustomSelectTag
            value={feeFilter}
            options={feeOptions}
            onOptionItemClick={(e) => {
              const v = e.target.value;
              setFeeFilter(v);
              if (v) setSearchQuery("");
            }}
            selectClassName="w-[min(100%,220px)] min-w-[180px] py-2.5 border border-zinc-200 rounded-lg"
          />
        </div>
        <div>
          <CustomSelectTag
            value={selectedStatus}
            options={STATUS_OPTIONS}
            onOptionItemClick={(e) => setSelectedStatus(e.target.value)}
            selectClassName="w-[min(100%,200px)] min-w-[160px] py-2.5 border border-zinc-200 rounded-lg"
          />
        </div>
        <p className="ml-auto text-sm text-zinc-500 pb-2">
          {resultCount} result{resultCount === 1 ? "" : "s"}
        </p>
      </div>

      <section className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
            <HashLoader color="#AB58E7" size={40} />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 font-medium text-zinc-600">Date</th>
                <th className="px-4 py-3 font-medium text-zinc-600">
                  Fees paid
                </th>
                <th className="px-4 py-3 font-medium text-zinc-600">Status</th>
                <th className="px-4 py-3 font-medium text-zinc-600">
                  Amount (GHS)
                </th>
                <th className="px-4 py-3 font-medium text-zinc-600">
                  Receipt #
                </th>
                <th className="pl-4 py-3 font-medium text-zinc-600 text-right pr-8">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const displayDate = tx.paymentDate || tx.createdAt;
                const allocLines = sortedAllocations(tx.allocations).map(
                  allocationSummaryLine
                );
                return (
                  <tr
                    key={tx.id}
                    className="border-b border-zinc-100 hover:bg-zinc-50/80"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-700">
                      {formatPaymentDate(displayDate)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      <div className="space-y-1">
                        {allocLines.length > 0 ? (
                          allocLines.map((line, i) => (
                            <div key={i} className="text-xs leading-relaxed">
                              {line}
                            </div>
                          ))
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${statusBadgeClass(
                          tx.status
                        )}`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums">
                      {formatGHS(tx.amount)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-800">
                      {tx.receipt?.receiptNumber ?? "—"}
                    </td>
                    <td className="pl-4 py-3 pr-8">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openDrawer(tx)}
                          className="rounded-md p-1.5 text-zinc-600 cursor-pointer hover:bg-violet-50 hover:text-violet-700"
                          aria-label="View details"
                        >
                          <IconEye size={20} />
                        </button>
                        {tx.status === "PAID" && tx.receipt && (
                          <button
                            type="button"
                            onClick={() => openReceipt(tx.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 cursor-pointer hover:bg-zinc-50"
                            aria-label="View receipt"
                          >
                            <IconFileText size={16} />
                            Receipt
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && transactions.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-zinc-500"
                  >
                    No payment transactions match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {drawerTx && (
        <PaymentDetailDrawer
          transaction={drawerTx}
          onClose={closeDrawer}
          onViewReceipt={openReceipt}
        />
      )}
    </div>
  );
};

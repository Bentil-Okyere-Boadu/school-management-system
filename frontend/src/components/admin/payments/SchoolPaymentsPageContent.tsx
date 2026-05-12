"use client";

import { SchoolPaymentTransaction } from "@/@types";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import { Pagination } from "@/components/common/Pagination";
import { SearchBar } from "@/components/common/SearchBar";
import { useDebouncer } from "@/hooks/generalHooks";
import {
  useGetSchoolPaymentConfig,
  useGetSchoolPayments,
} from "@/hooks/school-admin";
import { IconEye, IconFileText } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { HashLoader } from "react-spinners";
import { PaymentDetailDrawer } from "./PaymentDetailDrawer";
import { SchoolPaymentsNotOnboarded } from "./SchoolPaymentsNotOnboarded";
import {
  allocatedToPreview,
  formatGHS,
  formatPaymentDate,
  showNetAmount,
  statusBadgeClass,
} from "./paymentUtils";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "UNPAID", label: "Unpaid" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PAGE_SIZE = 10;

export const SchoolPaymentsPageContent: React.FC = () => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [drawerTx, setDrawerTx] = useState<SchoolPaymentTransaction | null>(
    null
  );
  const debouncedSearch = useDebouncer(searchQuery);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, dateFrom, dateTo]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const { config: paymentConfig, isLoading: paymentConfigLoading } =
    useGetSchoolPaymentConfig();

  const effectivePaymentStatus = paymentConfig?.status ?? "not_onboarded";
  const isPaymentNotOnboarded =
    !paymentConfigLoading && effectivePaymentStatus === "not_onboarded";
  const paymentsQueryEnabled =
    !paymentConfigLoading && effectivePaymentStatus !== "not_onboarded";

  const { transactions, meta, summary, isLoading } = useGetSchoolPayments(
    {
      page: currentPage,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      status: selectedStatus,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    },
    paymentsQueryEnabled
  );

  const totalPages = meta?.totalPages ?? 1;
  const resultCount = meta?.total ?? 0;

  const openDrawer = (tx: SchoolPaymentTransaction) => setDrawerTx(tx);
  const closeDrawer = () => setDrawerTx(null);

  const openReceipt = (transactionId: string) => {
    setDrawerTx(null);
    router.push(`/admin/payments/receipt/${transactionId}`);
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedStatus.length > 0 ||
    dateFrom.length > 0 ||
    dateTo.length > 0;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const totalTransactions =
    summary?.totalTransactions ?? meta?.total ?? 0;
  const paidCount = summary?.paidCount ?? 0;
  const pendingCount = summary?.pendingCount ?? 0;
  const totalGross = summary?.totalAmountGhs ?? 0;

  const pageHeader = (
    <header className="mb-6">
      <h1 className="text-2xl font-bold text-zinc-900">All payments</h1>
      <p className="mt-1 text-sm text-zinc-500">
        School-wide payment transactions across all students.
      </p>
    </header>
  );

  if (paymentConfigLoading) {
    return (
      <div className="pb-8">
        {pageHeader}
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-zinc-200 bg-white">
          <HashLoader color="#AB58E7" size={40} />
        </div>
      </div>
    );
  }

  if (isPaymentNotOnboarded) {
    return (
      <div className="pb-8">
        {pageHeader}
        <SchoolPaymentsNotOnboarded
          defaultContactEmail={""}
        />
      </div>
    );
  }

  return (
    <div className="pb-8">
      {pageHeader}

      <div className="mb-6 grid gap-4 sm:grid-cols-3 mx-1">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm tracking-wide text-zinc-500">
            Total transactions
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-zinc-900">
            {totalTransactions}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm tracking-wide text-zinc-500">
            Paid / Pending
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            <span className="text-emerald-600">{paidCount}</span>
            <span className="text-zinc-400 mx-1">/</span>
            <span className="text-amber-600">{pendingCount}</span>
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm tracking-wide text-zinc-500">
            Total amount (GHS)
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-zinc-900">
            {formatGHS(totalGross)}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <SearchBar
          value={searchQuery}
          onSearch={setSearchQuery}
          placeholder="Search student, ID"
          className="w-[min(100%,380px)] ml-1"
        />
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            Status
          </label>
          <CustomSelectTag
            value={selectedStatus}
            options={STATUS_OPTIONS}
            onOptionItemClick={(e) => setSelectedStatus(e.target.value)}
            selectClassName="w-[min(100%,220px)] min-w-[180px] py-2.5"
          />
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </div>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg cursor-pointer border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Clear filters
          </button>
        )}
        <p className="ml-auto text-sm text-zinc-500 self-end pb-2">
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
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 font-medium text-zinc-600">Student</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Date</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Status</th>
                <th className="px-4 py-3 font-medium text-zinc-600 text-right">
                  Amount (GHS)
                </th>
                <th className="px-4 py-3 font-medium text-zinc-600 text-right">
                  Net (GHS)
                </th>
                <th className="px-4 py-3 font-medium text-zinc-600 min-w-[200px]">
                  Allocated to
                </th>
                <th className="px-4 py-3 font-medium text-zinc-600">Channel</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Fulfilled</th>
                <th className="px-4 py-3 font-medium text-zinc-600 w-[100px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const s = tx.student;
                const name = `${s?.firstName ?? ""} ${s?.lastName ?? ""}`.trim();
                const { lines, more } = allocatedToPreview(tx, 2);
                const displayDate = tx.paymentDate || tx.createdAt;
                return (
                  <tr
                    key={tx.id}
                    className="border-b border-zinc-100 hover:bg-zinc-50/80"
                  >
                    <td className="px-4 py-3 min-w-36">
                      <div className="font-semibold text-zinc-900">{name}</div>
                      <div className="text-xs text-zinc-500">
                        {s?.studentId ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">
                      {formatPaymentDate(displayDate)}
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
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {formatGHS(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-800">
                      {showNetAmount(tx.status)
                        ? formatGHS(tx.amountAfterCharges)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      <div className="max-w-[280px]">
                        {lines.map((line, i) => (
                          <div key={i} className="text-xs leading-relaxed">
                            {line}
                          </div>
                        ))}
                        {more > 0 && (
                          <span className="text-xs text-zinc-500">
                            +{more} more
                          </span>
                        )}
                        {lines.length === 0 && (
                          <span className="text-zinc-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {tx.status === "PAID" && tx.paymentMethod
                        ? tx.paymentMethod
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          tx.isFulfilled ? "bg-emerald-500" : "bg-zinc-300"
                        }`}
                        title={tx.isFulfilled ? "Fulfilled" : "Not fulfilled"}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
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
                            className="rounded-md p-1.5 text-zinc-600 cursor-pointer hover:bg-violet-50 hover:text-violet-700"
                            aria-label="View receipt"
                          >
                            <IconFileText size={20} />
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
                    colSpan={9}
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

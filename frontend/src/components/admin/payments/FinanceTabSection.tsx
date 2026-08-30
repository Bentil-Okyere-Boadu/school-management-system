"use client";

import {
  FinanceBalanceStatus,
  FinanceClassRow,
  FinanceStudentRow,
} from "@/@types";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import { Pagination } from "@/components/common/Pagination";
import { SearchBar } from "@/components/common/SearchBar";
import { useDebouncer } from "@/hooks/generalHooks";
import {
  useGetClassLevels,
  useGetFinanceClasses,
  useGetFinanceStudents,
  useGetFinanceSummary,
} from "@/hooks/school-admin";
import { getInitials } from "@/utils/helpers";
import { IconEye, IconX } from "@tabler/icons-react";
import React, { useEffect, useMemo, useState } from "react";
import { HashLoader } from "react-spinners";
import { FinanceStudentDetailDrawer } from "./FinanceStudentDetailDrawer";
import {
  formatFinanceDate,
  formatGHSCurrency,
} from "./paymentUtils";

const PAGE_SIZE = 10;

const BALANCE_OPTIONS = [
  { value: "all", label: "All balances" },
  { value: "owing", label: "Owing" },
  { value: "clear", label: "Clear" },
  { value: "prepaid", label: "Prepaid" },
];

type ViewMode = "student" | "class";

const selectBaseClass =
  "w-[min(100%,180px)] min-w-[140px] py-2.5 px-3 border rounded-lg text-sm text-zinc-800";
const selectIdleClass = "border-zinc-200";
const selectActiveClass = "border-blue-500 bg-blue-50/40";

function SummaryCard({
  label,
  value,
  valueClassName = "text-zinc-900",
  isLoading = false,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  isLoading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-sm tracking-wide text-zinc-500">{label}</p>
      {isLoading ? (
        <div className="mt-3 h-8 w-24 animate-pulse rounded-md bg-zinc-100" />
      ) : (
        <p
          className={`mt-2 text-xl font-semibold tabular-nums sm:text-2xl ${valueClassName}`}
        >
          {value}
        </p>
      )}
    </div>
  );
}

function SegmentedControl({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  const base =
    "rounded-md px-4 py-1 text-sm font-medium transition-all cursor-pointer";
  return (
    <div className="inline-flex rounded-lg bg-gray-200 p-1.5">
      <button
        type="button"
        onClick={() => onChange("student")}
        className={`${base} ${
          value === "student"
            ? "bg-white text-slate-800 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        By student
      </button>
      <button
        type="button"
        onClick={() => onChange("class")}
        className={`${base} ${
          value === "class"
            ? "bg-white text-slate-800 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        By class
      </button>
    </div>
  );
}

export const FinanceTabSection: React.FC<{
  calendarId: string;
  termId: string;
  periodLabel: string;
  periodReady: boolean;
}> = ({ calendarId, termId, periodLabel, periodReady }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("student");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [balanceStatus, setBalanceStatus] =
    useState<FinanceBalanceStatus>("all");
  const [drawerStudentId, setDrawerStudentId] = useState<string | null>(null);
  const debouncedSearch = useDebouncer(searchQuery);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedClassId, balanceStatus, calendarId, termId]);

  const studentsEnabled = viewMode === "student";
  const financeFilters = {
    search: debouncedSearch,
    classLevelId: selectedClassId || undefined,
    balanceStatus,
    academicTermId: termId || undefined,
    academicCalendarId: calendarId || undefined,
  };

  const { students, meta, isLoading: studentsLoading } = useGetFinanceStudents(
    {
      page: currentPage,
      limit: PAGE_SIZE,
      ...financeFilters,
    },
    studentsEnabled && periodReady
  );

  const { summary, isLoading: summaryLoading } = useGetFinanceSummary(
    financeFilters,
    studentsEnabled && periodReady
  );

  const { classLevels } = useGetClassLevels("", termId || undefined);

  const classesEnabled = viewMode === "class";
  const { classes, isLoading: classesLoading } = useGetFinanceClasses(
    {
      academicTermId: termId || undefined,
      academicCalendarId: calendarId || undefined,
    },
    classesEnabled && periodReady
  );

  const classOptions = useMemo(
    () => [
      { value: "", label: "All classes" },
      ...classLevels.map((c) => ({
        value: c.id,
        label: c.name,
      })),
    ],
    [classLevels]
  );

  const classSummary = useMemo(() => {
    return classes.reduce(
      (acc, row) => {
        acc.totalPayable += row.totalPayable;
        acc.totalPaid += row.totalPaid;
        acc.outstanding += row.outstanding;
        acc.arrears += row.arrears;
        acc.prepayment += row.prepayment;
        return acc;
      },
      {
        totalPayable: 0,
        totalPaid: 0,
        outstanding: 0,
        arrears: 0,
        prepayment: 0,
      }
    );
  }, [classes]);

  const displaySummary =
    viewMode === "student"
      ? {
          totalPayable: summary?.totalPayable ?? 0,
          totalPaid: summary?.totalPaid ?? 0,
          outstanding: summary?.outstanding ?? 0,
          arrears: summary?.arrears ?? 0,
          prepayment: summary?.prepayment ?? 0,
        }
      : classSummary;

  const summaryCardsLoading =
    viewMode === "student" ? summaryLoading : classesLoading;

  const totalPages = meta?.totalPages ?? 1;
  const resultCount = meta?.total ?? 0;
  const isLoading =
    viewMode === "student" ? studentsLoading : classesLoading;

  const openDrawer = (studentId: string) => setDrawerStudentId(studentId);
  const closeDrawer = () => setDrawerStudentId(null);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedClassId !== "" ||
    balanceStatus !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedClassId("");
    setBalanceStatus("all");
    setCurrentPage(1);
  };

  const handleClassRowClick = (row: FinanceClassRow) => {
    setSearchQuery("");
    setBalanceStatus("all");
    setSelectedClassId(row.classLevelId);
    setCurrentPage(1);
    setViewMode("student");
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Finance</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Track student balances, arrears, and class financial summaries
          {periodLabel ? ` for ${periodLabel}.` : "."}
        </p>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mx-1">
        <SummaryCard
          label="Total payable"
          value={formatGHSCurrency(displaySummary.totalPayable)}
          isLoading={summaryCardsLoading}
        />
        <SummaryCard
          label="Total paid"
          value={formatGHSCurrency(displaySummary.totalPaid)}
          valueClassName="text-emerald-600"
          isLoading={summaryCardsLoading}
        />
        <SummaryCard
          label="Outstanding"
          value={formatGHSCurrency(displaySummary.outstanding)}
          valueClassName="text-amber-600"
          isLoading={summaryCardsLoading}
        />
        <SummaryCard
          label="Arrears"
          value={formatGHSCurrency(displaySummary.arrears)}
          valueClassName="text-red-600"
          isLoading={summaryCardsLoading}
        />
        <SummaryCard
          label="Prepayments"
          value={formatGHSCurrency(displaySummary.prepayment)}
          valueClassName="text-emerald-600"
          isLoading={summaryCardsLoading}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <SegmentedControl value={viewMode} onChange={setViewMode} />
        {viewMode === "student" && (
          <p className="text-sm text-zinc-500">
            {resultCount} result{resultCount === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {viewMode === "student" && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3">
          <SearchBar
            value={searchQuery}
            onSearch={setSearchQuery}
            placeholder="Search by name or student ID"
            className="min-w-[200px] flex-1 border border-zinc-200 !ring-0 focus-within:border-blue-500"
          />
          <CustomSelectTag
            value={selectedClassId}
            options={classOptions}
            onOptionItemClick={(e) => setSelectedClassId(e.target.value)}
            selectClassName={`${selectBaseClass} ${
              selectedClassId ? selectActiveClass : selectIdleClass
            }`}
          />
          <CustomSelectTag
            value={balanceStatus}
            options={BALANCE_OPTIONS}
            onOptionItemClick={(e) =>
              setBalanceStatus(e.target.value as FinanceBalanceStatus)
            }
            selectClassName={`${selectBaseClass} ${
              balanceStatus !== "all" ? selectActiveClass : selectIdleClass
            }`}
          />
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex shrink-0 items-center gap-1.5 px-1.5 py-2 text-sm font-medium text-zinc-700 cursor-pointer hover:text-zinc-900"
            >
              <IconX size={16} stroke={2} />
              Clear
            </button>
          )}
        </div>
      )}

      <section className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
            <HashLoader color="#AB58E7" size={40} />
          </div>
        )}

        {viewMode === "student" ? (
          <StudentFinanceTable
            students={students}
            isLoading={studentsLoading}
            onView={openDrawer}
          />
        ) : (
          <ClassFinanceTable
            classes={classes}
            isLoading={classesLoading}
            onRowClick={handleClassRowClick}
          />
        )}
      </section>

      {viewMode === "student" && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {drawerStudentId && (
        <FinanceStudentDetailDrawer
          studentId={drawerStudentId}
          calendarId={calendarId}
          termId={termId}
          periodLabel={periodLabel}
          onClose={closeDrawer}
        />
      )}
    </div>
  );
};

function StudentFinanceTable({
  students,
  isLoading,
  onView,
}: {
  students: FinanceStudentRow[];
  isLoading: boolean;
  onView: (studentId: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            <th className="px-4 py-3 font-medium text-zinc-600">Student</th>
            <th className="px-4 py-3 font-medium text-zinc-600">Student ID</th>
            <th className="px-4 py-3 font-medium text-zinc-600">Class</th>
            <th className="px-4 py-3 font-medium text-zinc-600 text-right">
              Total payable
            </th>
            <th className="px-4 py-3 font-medium text-zinc-600 text-right">
              Paid
            </th>
            <th className="px-4 py-3 font-medium text-zinc-600 text-right">
              Outstanding
            </th>
            <th className="px-4 py-3 font-medium text-zinc-600 text-right">
              Arrears
            </th>
            <th className="px-4 py-3 font-medium text-zinc-600 text-right">
              Prepayment
            </th>
            <th className="px-4 py-3 font-medium text-zinc-600 text-right">
              Net balance
            </th>
            <th className="px-4 py-3 font-medium text-zinc-600">Next due</th>
            <th className="px-4 py-3 font-medium text-zinc-600 w-[100px]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((row) => {
            const name = `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim();
            const pending = row.hasPendingBalance || row.netBalance > 0;
            return (
              <tr
                key={row.studentId}
                className={`border-b border-zinc-100 hover:bg-zinc-50/80 ${
                  pending ? "border-l-4 border-l-amber-400" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-800">
                      {getInitials(row.firstName, row.lastName)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-zinc-900">{name}</div>
                      {pending && (
                        <span className="mt-0.5 inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-700">{row.studentCode}</td>
                <td className="px-4 py-3 text-zinc-700">
                  {row.className ?? "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-800">
                  {formatGHSCurrency(row.totalPayable)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-800">
                  {formatGHSCurrency(row.totalPaid)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-800">
                  {formatGHSCurrency(row.outstanding)}
                </td>
                <td
                  className={`px-4 py-3 text-right tabular-nums ${
                    row.arrears > 0 ? "text-red-600" : "text-zinc-800"
                  }`}
                >
                  {formatGHSCurrency(row.arrears)}
                </td>
                <td
                  className={`px-4 py-3 text-right tabular-nums ${
                    row.prepayment > 0 ? "text-emerald-600" : "text-zinc-800"
                  }`}
                >
                  {formatGHSCurrency(row.prepayment)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-medium tabular-nums ${
                    row.netBalance > 0 ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {formatGHSCurrency(row.netBalance)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-zinc-700">
                  {formatFinanceDate(row.nextDueDate)}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onView(row.studentId)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 cursor-pointer hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200"
                  >
                    <IconEye size={16} />
                    View
                  </button>
                </td>
              </tr>
            );
          })}
          {!isLoading && students.length === 0 && (
            <tr>
              <td
                colSpan={11}
                className="px-4 py-12 text-center text-zinc-500"
              >
                No students match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ClassFinanceTable({
  classes,
  isLoading,
  onRowClick,
}: {
  classes: FinanceClassRow[];
  isLoading: boolean;
  onRowClick: (row: FinanceClassRow) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            <th className="px-4 py-3 font-medium text-zinc-600">Class</th>
            <th className="px-4 py-3 font-medium text-zinc-600">Students</th>
            <th className="px-4 py-3 font-medium text-zinc-600 text-right">
              Total payable
            </th>
            <th className="px-4 py-3 font-medium text-zinc-600 text-right">
              Paid
            </th>
            <th className="px-4 py-3 font-medium text-zinc-600 text-right">
              Outstanding
            </th>
            <th className="px-4 py-3 font-medium text-zinc-600 text-right">
              Arrears
            </th>
            <th className="px-4 py-3 font-medium text-zinc-600 text-right">
              Prepayments
            </th>
            <th className="px-4 py-3 font-medium text-zinc-600 text-right">
              Net balance
            </th>
          </tr>
        </thead>
        <tbody>
          {classes.map((row) => (
            <tr
              key={row.classLevelId}
              onClick={() => onRowClick(row)}
              className="border-b border-zinc-100 hover:bg-zinc-50/80 cursor-pointer"
            >
              <td className="px-4 py-3 font-semibold text-zinc-900">
                {row.className}
              </td>
              <td className="px-4 py-3 text-zinc-700">{row.studentCount}</td>
              <td className="px-4 py-3 text-right tabular-nums text-zinc-800">
                {formatGHSCurrency(row.totalPayable)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-zinc-800">
                {formatGHSCurrency(row.totalPaid)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-amber-600">
                {formatGHSCurrency(row.outstanding)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-red-600">
                {formatGHSCurrency(row.arrears)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-emerald-600">
                {formatGHSCurrency(row.prepayment)}
              </td>
              <td
                className={`px-4 py-3 text-right font-medium tabular-nums ${
                  row.netBalance > 0 ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {formatGHSCurrency(row.netBalance)}
              </td>
            </tr>
          ))}
          {!isLoading && classes.length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="px-4 py-12 text-center text-zinc-500"
              >
                No classes found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

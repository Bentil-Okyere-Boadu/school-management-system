"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge, Combobox, Select } from "@mantine/core";
import {
  IconActivity,
  IconDownload,
  IconFilter,
  IconTrendingDown,
  IconTrendingUp,
  IconTrophy,
  IconUsers,
} from "@tabler/icons-react";
import { HashLoader } from "react-spinners";
import { toast } from "react-toastify";

import {
  useGetAllSubjects,
  useGetCalendars,
  useGetClassLevels,
  useGetClassSubjectPerformance,
} from "@/hooks/school-admin";
import { getSortedSchoolTerms } from "@/utils/schoolTerms";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
import PerformanceBreakdownTable from "@/components/admin/performance/PerformanceBreakdownTable";
import ScoreDistributionChart from "@/components/admin/performance/ScoreDistributionChart";
import {
  CLUSTER_DISTRIBUTION_KEY,
  CLUSTER_ORDER,
  CLUSTER_STYLES,
  SCORE_RANGE_OPTIONS,
} from "@/components/admin/performance/performanceClusters";
import type { ClassLevel, PerformanceCluster, Subject } from "@/@types";

type StatAccent = "violet" | "cyan" | "indigo" | "emerald" | "rose";

const statAccentClass: Record<StatAccent, string> = {
  violet: "bg-violet-50 text-violet-600",
  cyan: "bg-cyan-50 text-cyan-600",
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
};

function StatCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent: StatAccent;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${statAccentClass[accent]}`}
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 tabular-nums leading-tight mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );
}

const CLUSTER_OPTIONS = [
  { value: "", label: "All Clusters" },
  ...CLUSTER_ORDER.map((c) => ({ value: c, label: c })),
];

const filterIcon = (
  <IconFilter size={16} className="text-zinc-400" aria-hidden />
);

const PA = {
  classLevel: "classLevelId",
  term: "academicTermId",
  subject: "subjectCatalogId",
  cluster: "cluster",
  scoreRange: "scoreRange",
} as const;

type PerformanceFilters = {
  selectedClassId: string | null;
  selectedTermId: string | null;
  selectedSubjectId: string | null;
  selectedCluster: string;
  selectedScoreRange: string;
};

function buildFilterSearchParams(filters: PerformanceFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.selectedClassId) p.set(PA.classLevel, filters.selectedClassId);
  if (filters.selectedTermId) p.set(PA.term, filters.selectedTermId);
  if (filters.selectedSubjectId) p.set(PA.subject, filters.selectedSubjectId);
  if (filters.selectedCluster) p.set(PA.cluster, filters.selectedCluster);
  if (filters.selectedScoreRange) p.set(PA.scoreRange, filters.selectedScoreRange);
  return p;
}

function filtersMatchUrl(
  filters: PerformanceFilters,
  searchParams: URLSearchParams
): boolean {
  return (
    (searchParams.get(PA.classLevel) ?? "") === (filters.selectedClassId ?? "") &&
    (searchParams.get(PA.term) ?? "") === (filters.selectedTermId ?? "") &&
    (searchParams.get(PA.subject) ?? "") === (filters.selectedSubjectId ?? "") &&
    (searchParams.get(PA.cluster) ?? "") === filters.selectedCluster &&
    (searchParams.get(PA.scoreRange) ?? "") === filters.selectedScoreRange
  );
}

const PerformanceAnalyticsPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedClassId, setSelectedClassId] = useState<string | null>(
    () => searchParams.get(PA.classLevel) || null
  );
  const [selectedTermId, setSelectedTermId] = useState<string | null>(
    () => searchParams.get(PA.term) || null
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    () => searchParams.get(PA.subject) || null
  );
  const [selectedCluster, setSelectedCluster] = useState<string>(
    () => searchParams.get(PA.cluster) ?? ""
  );
  const [selectedScoreRange, setSelectedScoreRange] = useState<string>(
    () => searchParams.get(PA.scoreRange) ?? ""
  );

  const { classLevels } = useGetClassLevels("");
  const { subjects } = useGetAllSubjects();
  const { calendars } = useGetCalendars();

  const sortedTerms = useMemo(
    () => getSortedSchoolTerms(calendars),
    [calendars]
  );
  const latestTermId = sortedTerms[0]?.id;

  const currentFilters = useMemo<PerformanceFilters>(
    () => ({
      selectedClassId,
      selectedTermId,
      selectedSubjectId,
      selectedCluster,
      selectedScoreRange,
    }),
    [
      selectedClassId,
      selectedTermId,
      selectedSubjectId,
      selectedCluster,
      selectedScoreRange,
    ]
  );

  const replaceFiltersUrl = useCallback(
    (next: PerformanceFilters) => {
      if (filtersMatchUrl(next, searchParams)) return;
      const queryString = buildFilterSearchParams(next).toString();
      router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const updateFilters = useCallback(
    (partial: Partial<PerformanceFilters>) => {
      const next = { ...currentFilters, ...partial };
      if (partial.selectedClassId !== undefined)
        setSelectedClassId(partial.selectedClassId);
      if (partial.selectedTermId !== undefined)
        setSelectedTermId(partial.selectedTermId);
      if (partial.selectedSubjectId !== undefined)
        setSelectedSubjectId(partial.selectedSubjectId);
      if (partial.selectedCluster !== undefined)
        setSelectedCluster(partial.selectedCluster);
      if (partial.selectedScoreRange !== undefined)
        setSelectedScoreRange(partial.selectedScoreRange);
      
      replaceFiltersUrl(next);
    },
    [currentFilters, replaceFiltersUrl]
  );

  useEffect(() => {
    setSelectedClassId(searchParams.get(PA.classLevel) || null);
    setSelectedTermId(searchParams.get(PA.term) || null);
    setSelectedSubjectId(searchParams.get(PA.subject) || null);
    setSelectedCluster(searchParams.get(PA.cluster) ?? "");
    setSelectedScoreRange(searchParams.get(PA.scoreRange) ?? "");
  }, [searchParams]);

  const buildOverviewUrl = useCallback(() => {
    const queryString = buildFilterSearchParams(currentFilters).toString();
    return `${pathname}${queryString ? `?${queryString}` : ""}`;
  }, [currentFilters, pathname]);

  // Default the term to the latest available term when URL/state has no valid term.
  useEffect(() => {
    if (sortedTerms.length === 0) return;

    const urlTerm = searchParams.get(PA.term) ?? "";
    let nextTerm = "";
    if (urlTerm && sortedTerms.some((t) => t.id === urlTerm)) {
      nextTerm = urlTerm;
    } else if (
      selectedTermId &&
      sortedTerms.some((t) => t.id === selectedTermId)
    ) {
      nextTerm = selectedTermId;
    } else {
      nextTerm = sortedTerms[0].id;
    }

    const next = { ...currentFilters, selectedTermId: nextTerm };
    if (nextTerm !== selectedTermId) setSelectedTermId(nextTerm);
    replaceFiltersUrl(next);
  }, [sortedTerms]);

  const classOptions = useMemo(
    () =>
      (classLevels ?? []).map((c: ClassLevel) => ({
        value: c.id,
        label: c.name,
      })),
    [classLevels]
  );

  const subjectOptions = useMemo(
    () =>
      (subjects ?? [])
        .filter((s: Subject) => Boolean(s.id))
        .map((s: Subject) => ({ value: s.id as string, label: s.name })),
    [subjects]
  );

  // Default the class to the first available class when URL/state has no valid class.
  useEffect(() => {
    if (classOptions.length === 0) return;

    const urlClass = searchParams.get(PA.classLevel) ?? "";
    let nextClass: string;
    if (urlClass && classOptions.some((c) => c.value === urlClass)) {
      nextClass = urlClass;
    } else if (
      selectedClassId &&
      classOptions.some((c) => c.value === selectedClassId)
    ) {
      nextClass = selectedClassId;
    } else {
      nextClass = classOptions[0].value;
    }

    const next = { ...currentFilters, selectedClassId: nextClass };
    if (nextClass !== selectedClassId) setSelectedClassId(nextClass);
    replaceFiltersUrl(next);
  }, [classOptions]);

  // Default the subject to the first available subject when URL/state has no valid subject.
  useEffect(() => {
    if (subjectOptions.length === 0) return;

    const urlSubject = searchParams.get(PA.subject) ?? "";
    let nextSubject: string;
    if (urlSubject && subjectOptions.some((s) => s.value === urlSubject)) {
      nextSubject = urlSubject;
    } else if (
      selectedSubjectId &&
      subjectOptions.some((s) => s.value === selectedSubjectId)
    ) {
      nextSubject = selectedSubjectId;
    } else {
      nextSubject = subjectOptions[0].value;
    }

    const next = { ...currentFilters, selectedSubjectId: nextSubject };
    if (nextSubject !== selectedSubjectId) setSelectedSubjectId(nextSubject);
    replaceFiltersUrl(next);
  }, [subjectOptions]);

  const termSelectData = useMemo(
    () =>
      sortedTerms.map((t) => {
        const cal = calendars.find((c) =>
          c.terms?.some((term) => term.id === t.id)
        );
        const label = cal ? `${t.termName} — ${cal.name}` : t.termName;
        return { value: t.id, label };
      }),
    [sortedTerms, calendars]
  );

  const showLatestInSelect = Boolean(
    latestTermId && selectedTermId === latestTermId
  );

  const termSelectRightSection = useMemo(
    () => (
      <div className="flex items-center justify-end gap-1.5 pr-0.5">
        {showLatestInSelect && (
          <Badge
            variant="light"
            size="xs"
            className="shrink-0 font-semibold"
            style={{ backgroundColor: "#F3E8FF", color: "#6B21A8" }}
          >
            Latest
          </Badge>
        )}
        <Combobox.Chevron size="sm" />
      </div>
    ),
    [showLatestInSelect]
  );

  const scoreRange = useMemo(
    () => SCORE_RANGE_OPTIONS.find((o) => o.value === selectedScoreRange),
    [selectedScoreRange]
  );

  const filtersReady = Boolean(
    selectedClassId && selectedTermId && selectedSubjectId
  );

  const { performance, isLoading, isFetching } = useGetClassSubjectPerformance(
    {
      classLevelId: selectedClassId ?? "",
      academicTermId: selectedTermId ?? "",
      subjectCatalogId: selectedSubjectId ?? "",
      cluster: (selectedCluster || undefined) as PerformanceCluster | undefined,
      scoreRangeMin: scoreRange?.min,
      scoreRangeMax: scoreRange?.max,
    },
    { enabled: filtersReady }
  );

  const summary = performance?.summary;
  const distribution = performance?.clusterDistribution;
  const students = performance?.students ?? [];

  const fmtPercent = (value: number | null | undefined) =>
    value === null || value === undefined ? "—" : `${Math.round(value)}%`;

  const handleExportCsv = () => {
    if (!performance || students.length === 0) {
      toast.info("Nothing to export yet.");
      return;
    }
    const header = [
      "Rank",
      "Student Name",
      "Class",
      "Subject",
      "Aggregated Score (%)",
      "Cluster",
    ];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = students.map((s) =>
      [
        String(s.rank),
        s.studentName,
        s.classLevelName,
        s.subjectName,
        s.aggregatedScore === null ? "" : String(s.aggregatedScore),
        s.cluster ?? "",
      ]
        .map(escape)
        .join(",")
    );
    const csv = [header.map(escape).join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeClass = performance.classLevel.name.replace(/\s+/g, "-");
    const safeSubject = performance.subject.name.replace(/\s+/g, "-");
    link.href = url;
    link.download = `performance-${safeClass}-${safeSubject}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    if (!filtersReady) {
      return (
        <NoAvailableEmptyState
          message="Select a class, academic term, and subject to view the performance breakdown."
        />
      );
    }

    if (isLoading) {
      return (
        <output
          className="flex justify-center py-24"
          aria-label="Loading performance breakdown"
        >
          <HashLoader color="#AB58E7" size={40} />
        </output>
      );
    }

    if (!performance) {
      return (
        <NoAvailableEmptyState message="No performance data available for this selection." />
      );
    }

    return (
      <div
        className={`flex flex-col gap-5 transition-opacity ${
          isFetching ? "opacity-60" : "opacity-100"
        }`}
      >
        {/* Summary stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard
            title="Total Students"
            value={String(summary?.totalStudents ?? 0)}
            accent="violet"
            icon={<IconUsers size={22} stroke={1.75} />}
          />
          <StatCard
            title="Class Average"
            value={fmtPercent(summary?.classAverage)}
            accent="cyan"
            icon={<IconTrendingUp size={22} stroke={1.75} />}
          />
          <StatCard
            title="Median Score"
            value={fmtPercent(summary?.medianScore)}
            accent="indigo"
            icon={<IconActivity size={22} stroke={1.75} />}
          />
          <StatCard
            title="Highest Score"
            value={fmtPercent(summary?.highestScore)}
            accent="emerald"
            icon={<IconTrophy size={22} stroke={1.75} />}
          />
          <StatCard
            title="Lowest Score"
            value={fmtPercent(summary?.lowestScore)}
            accent="rose"
            icon={<IconTrendingDown size={22} stroke={1.75} />}
          />
        </div>

        {/* Cluster distribution pills */}
        <div className="flex flex-wrap gap-2">
          {CLUSTER_ORDER.map((cluster) => {
            const count =
              distribution?.[CLUSTER_DISTRIBUTION_KEY[cluster]] ?? 0;
            const style = CLUSTER_STYLES[cluster];
            return (
              <span
                key={cluster}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${style.badgeClass}`}
              >
                <span className={`h-2 w-2 rounded-full ${style.dotClass}`} />
                {cluster}:
                <span className="font-semibold">
                  {count} student{count === 1 ? "" : "s"}
                </span>
              </span>
            );
          })}
        </div>

        {/* Score Distribution */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-semibold text-neutral-800">
            Score Distribution
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Each dot is one student · hover for details
          </p>
          <div className="mt-4">
            <ScoreDistributionChart
              key={`${selectedClassId}-${selectedTermId}-${selectedSubjectId}-${selectedCluster}-${selectedScoreRange}`}
              students={students}
              median={summary?.medianScore ?? null}
              classAverage={summary?.classAverage ?? null}
            />
          </div>
        </div>

          {/* Ranked breakdown table */}
          <PerformanceBreakdownTable
            students={students}
            isLoading={isFetching && !isLoading}
            onRowAction={(studentId) => {
              const params = new URLSearchParams();
              if (selectedTermId){
                params.set("academicTermId", selectedTermId);
              }
              if (selectedSubjectId){
                params.set("subjectCatalogId", selectedSubjectId);
              }
              params.set("returnPath", buildOverviewUrl());
              router.push(
                `/admin/performance-analytics/${studentId}?${params.toString()}`
              );
            }}
          />
      </div>
    );
  };

  return (
    <div className="pb-10 px-0.5">
      {/* Page heading */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-neutral-800">
          Performance Breakdown
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Compare student outcomes across classes, terms, and subjects.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px]">
            <Select
              label="Class"
              placeholder="Select class"
              data={classOptions}
              value={selectedClassId}
              onChange={(v) => updateFilters({ selectedClassId: v })}
              searchable
              nothingFoundMessage="No classes"
            />
          </div>
          <div className="flex-1 min-w-[190px]">
            <Select
              label="Academic Term"
              placeholder={
                sortedTerms.length ? "Select term" : "No terms available"
              }
              data={termSelectData}
              value={selectedTermId}
              onChange={(v) => updateFilters({ selectedTermId: v })}
              searchable
              disabled={sortedTerms.length === 0}
              rightSection={termSelectRightSection}
              rightSectionWidth={showLatestInSelect ? 118 : undefined}
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <Select
              label="Subject"
              placeholder="Select subject"
              data={subjectOptions}
              value={selectedSubjectId}
              onChange={(v) => updateFilters({ selectedSubjectId: v })}
              searchable
              nothingFoundMessage="No subjects"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <Select
              label="Cluster"
              data={CLUSTER_OPTIONS}
              value={selectedCluster}
              onChange={(v) => updateFilters({ selectedCluster: v ?? "" })}
              leftSection={filterIcon}
              allowDeselect={false}
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <Select
              label="Score Range"
              data={SCORE_RANGE_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              value={selectedScoreRange}
              onChange={(v) => updateFilters({ selectedScoreRange: v ?? "" })}
              leftSection={filterIcon}
              allowDeselect={false}
            />
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!filtersReady || students.length === 0}
            className="flex items-center gap-2 px-4 h-9 text-sm font-medium rounded-md border border-gray-200 text-zinc-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          >
            <IconDownload size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export default PerformanceAnalyticsPage;

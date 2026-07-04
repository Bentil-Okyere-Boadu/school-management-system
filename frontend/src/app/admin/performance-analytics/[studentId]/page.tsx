"use client";

import React, { useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Progress } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { HashLoader } from "react-spinners";

import {
  useGetCalendars,
  useGetStudentTopicPerformance,
} from "@/hooks/school-admin";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
import ClusterBadge from "@/components/admin/performance/ClusterBadge";
import {
  CLUSTER_STYLES,
  initialsFromName,
} from "@/components/admin/performance/performanceClusters";

const headerCell =
  "px-6 py-3.5 text-xs font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap border-b border-solid border-b-[#EAECF0] text-left max-md:px-5";
const bodyCell =
  "px-6 py-4 border-b border-solid border-b-[#EAECF0] whitespace-nowrap max-md:px-5";

const fmtPercent = (value: number | null | undefined) =>
  value === null || value === undefined ? "—" : `${Math.round(value)}%`;

const formatRange = (min: number | null, max: number | null) => {
  if (min === null || max === null) return "—";
  return `${Math.round(min)}%–${Math.round(max)}%`;
};

const StudentPerformanceDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const studentId = params.studentId as string;
  const academicTermId = searchParams.get("academicTermId") ?? "";
  const subjectCatalogId = searchParams.get("subjectCatalogId") ?? "";

  const paramsReady = Boolean(studentId && academicTermId && subjectCatalogId);

  const { topicPerformance, isLoading } = useGetStudentTopicPerformance(
    studentId,
    academicTermId,
    subjectCatalogId,
    { enabled: paramsReady }
  );

  const { calendars } = useGetCalendars();

  const termLabel = useMemo(() => {
    const termName = topicPerformance?.academicTerm.termName ?? "";
    const termId = topicPerformance?.academicTerm.id ?? academicTermId;
    const cal = calendars.find((c) =>
      c.terms?.some((t) => t.id === termId)
    );
    return cal ? `${termName} — ${cal.name}` : termName;
  }, [topicPerformance, calendars, academicTermId]);

  const student = topicPerformance?.student;
  const overallProgressColor = student?.cluster
    ? CLUSTER_STYLES[student.cluster].progressColor
    : "violet";

  const backButton = (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-sm text-violet-600 hover:underline transition-colors cursor-pointer mb-4"
    >
      <IconArrowLeft size={16} className="mt-1" />
      Back to Performance Breakdown
    </button>
  );

  if (!paramsReady) {
    return (
      <div className="pb-10 px-0.5">
        {backButton}
        <NoAvailableEmptyState message="Missing term or subject. Return to the performance breakdown and open a student from there." />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="pb-10 px-0.5">
        {backButton}
        <div
          className="flex justify-center py-24"
          role="status"
          aria-label="Loading student performance"
        >
          <HashLoader color="#AB58E7" size={40} />
        </div>
      </div>
    );
  }

  if (!topicPerformance || !student) {
    return (
      <div className="pb-10 px-0.5">
        {backButton}
        <NoAvailableEmptyState message="No performance data available for this student, term, and subject." />
      </div>
    );
  }

  return (
    <div className="pb-10 px-0.5">
      {backButton}

      <div className="flex flex-col gap-5">
        {/* Page title */}
        <h1 className="text-xl font-bold text-neutral-800">
          {student.name || "Student"}&apos;s Performance —{" "}
          {topicPerformance.subject.name}
        </h1>

        {/* Student summary card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 shrink-0 rounded-full bg-violet-500 text-white text-lg font-semibold flex items-center justify-center">
                {initialsFromName(student.name)}
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-neutral-800 truncate">
                  {student.name || "—"}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5 truncate">
                  {[student.classLevelName, termLabel]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="mt-2">
                  <ClusterBadge cluster={student.cluster} />
                </div>
              </div>
            </div>

            <div className="lg:w-80 lg:shrink-0">
              <p className="text-xs font-medium text-gray-500">
                Overall Subject Average
              </p>
              <div className="mt-2 flex items-center gap-3">
                <Progress
                  value={student.overallAveragePercent ?? 0}
                  color={overallProgressColor}
                  radius="xl"
                  size="md"
                  className="flex-1"
                />
                <span className="text-lg font-bold text-neutral-800 tabular-nums w-14 text-right">
                  {fmtPercent(student.overallAveragePercent)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Topic breakdown */}
        <div>
          <h2 className="text-base font-semibold text-neutral-800 mb-3">
            Topic Breakdown
          </h2>
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[840px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className={headerCell}>Topic</th>
                    <th className={headerCell}>Aggregated Score</th>
                    <th className={headerCell}>Average</th>
                    <th className={headerCell}>Range</th>
                    <th className={headerCell}>Median</th>
                    <th className={headerCell}>No. of Tests</th>
                    <th className={headerCell}>Cluster</th>
                  </tr>
                </thead>
                <tbody>
                  {topicPerformance.topics.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                          <p className="text-lg font-medium">No topics found</p>
                          <p className="text-sm text-gray-400 mt-1">
                            There are no graded topics for this subject and term
                            yet.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    topicPerformance.topics.map((topic) => (
                      <tr
                        key={topic.topicId}
                        className="hover:bg-gray-50/60 transition-colors"
                      >
                        <td className={`${bodyCell} text-sm text-zinc-800`}>
                          {topic.topicName}
                        </td>
                        <td
                          className={`${bodyCell} text-sm font-semibold text-zinc-900 tabular-nums`}
                        >
                          {fmtPercent(topic.studentAggregatedScore)}
                        </td>
                        <td
                          className={`${bodyCell} text-sm text-zinc-600 tabular-nums`}
                        >
                          {fmtPercent(topic.classAverage)}
                        </td>
                        <td
                          className={`${bodyCell} text-sm text-zinc-600 tabular-nums`}
                        >
                          {formatRange(topic.range.min, topic.range.max)}
                        </td>
                        <td
                          className={`${bodyCell} text-sm text-zinc-600 tabular-nums`}
                        >
                          {fmtPercent(topic.median)}
                        </td>
                        <td
                          className={`${bodyCell} text-sm text-zinc-600 tabular-nums`}
                        >
                          {topic.testCount}
                        </td>
                        <td className={bodyCell}>
                          <ClusterBadge cluster={topic.cluster} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default StudentPerformanceDetailPage;

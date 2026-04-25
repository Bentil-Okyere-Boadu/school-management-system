"use client";

import React, { useMemo } from "react";
import dayjs from "dayjs";
import { Accordion, Badge, Progress } from "@mantine/core";
import { BarChart } from "@mantine/charts";
import {
  IconCalendarEvent,
  IconClipboardList,
  IconClock,
  IconTrendingUp,
} from "@tabler/icons-react";
import type {
  Calendar,
  StudentPerformanceAnalytics as StudentAnalyticsPayload,
  TopicAssignmentGradeDetail,
} from "@/@types";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
import { TermFilterCard } from "@/components/common/TermFilterCard";
import { getSortedSchoolTerms } from "@/utils/schoolTerms";

function formatTs(iso: string) {
  const d = dayjs(iso);
  return d.isValid() ? d.format("MMM D, YYYY · h:mm A") : iso;
}

function AssignmentGradeRow({ row }: { row: TopicAssignmentGradeDetail }) {
  return (
    <div className="rounded-lg border border-zinc-200/90 bg-white p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="line-clamp-2 text-sm font-semibold text-zinc-900">
            {row.title}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-600">
            <span className="inline-flex items-center gap-1">
              <IconCalendarEvent size={14} className="opacity-70" aria-hidden />
              Due {formatTs(row.dueDate)}
            </span>
            <span>{row.classLevelName}</span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-600">
            <span className="inline-flex items-center gap-1">
              <IconClock size={14} className="opacity-70" aria-hidden />
              Submitted {formatTs(row.submittedAt)}
            </span>
            <span>Graded {formatTs(row.gradedAt)}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <Badge variant="filled" color="violet" size="lg" radius="sm">
            {row.score} / {row.maxScore}{" "}
            <span className="opacity-90">({row.percentage}%)</span>
          </Badge>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Badge variant="outline" color="gray" size="xs">
              {row.assignmentType === "online" ? "Online" : "Offline"}
            </Badge>
            <Badge variant="light" color="grape" size="xs">
              {row.submissionStatus.replace(/-/g, " ")}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

const accentIconWrap: Record<string, string> = {
  violet: "bg-violet-100 text-violet-700",
  cyan: "bg-cyan-100 text-cyan-700",
  indigo: "bg-indigo-100 text-indigo-700",
};

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  const iconWrap = accentIconWrap[accent] ?? accentIconWrap.violet;
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {title}
          </p>
          <p className="mt-1.5 text-2xl font-bold text-zinc-900">
            {value}
          </p>
          {subtitle ? (
            <p className="mt-1 text-xs text-zinc-500">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconWrap}`}
          aria-hidden
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export interface StudentPerformanceAnalyticsProps {
  calendars: Calendar[];
  calendarsLoading?: boolean;
  selectedTermId: string;
  onTermChange: (termId: string) => void;
  analytics: StudentAnalyticsPayload | null;
  isLoading: boolean;
  /** When true, copy clarifies that assignment/topic stats are limited to subjects the teacher teaches */
  teacherScoped?: boolean;
}

const StudentPerformanceAnalytics: React.FC<
  StudentPerformanceAnalyticsProps
> = ({
  calendars,
  calendarsLoading = false,
  selectedTermId,
  onTermChange,
  analytics,
  isLoading,
  teacherScoped,
}) => {
  const sortedTerms = useMemo(
    () => getSortedSchoolTerms(calendars ?? []),
    [calendars],
  );

  const hasTerms = sortedTerms.length > 0;

  const assignmentChartData = useMemo(() => {
    if (!analytics?.subjectAssignmentPerformance?.length) return [];
    return analytics.subjectAssignmentPerformance
      .filter((s) => s.averagePercent != null)
      .map((s) => ({
        subject:
          s.subjectName.length > 22
            ? `${s.subjectName.slice(0, 20)}…`
            : s.subjectName,
        Average: s.averagePercent as number,
      }));
  }, [analytics]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-[1px] shadow-lg">
        <div className="rounded-2xl bg-white/95 px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-zinc-900">
                Performance analytics
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Assignment outcomes by subject and topic-level averages for one
                academic period (term + calendar).
                {teacherScoped
                  ? " Scoped to subjects you teach this learner."
                  : ""}
              </p>
            </div>
            <TermFilterCard
              calendars={calendars ?? []}
              calendarsLoading={calendarsLoading}
              sortedTerms={sortedTerms}
              value={selectedTermId}
              onChange={onTermChange}
              fitFilterGrid
              className="w-full min-w-0 shrink-0  max-w-95"
            />
          </div>
        </div>
      </div>

      {!calendars?.length ? (
        <NoAvailableEmptyState message="No academic calendars are configured for this school yet." />
      ) : !hasTerms ? (
        <NoAvailableEmptyState message="No academic terms are configured yet. Add terms to your calendars to use analytics." />
      ) : null}

      {isLoading ? (
        <div
          className="flex justify-center py-16"
          role="status"
          aria-label="Loading analytics"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : null}

      {!isLoading && analytics && selectedTermId && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <StatCard
              title="Assignments average"
              value={
                analytics.summary.assignmentAveragePercent != null
                  ? `${analytics.summary.assignmentAveragePercent}%`
                  : "0%"
              }
              subtitle="Graded submissions for this term"
              accent="violet"
              icon={<IconTrendingUp size={22} />}
            />
            <StatCard
              title="Graded assignments"
              value={`${analytics.summary.gradedAssignmentsCount}`}
              subtitle="Includes topic-linked homework"
              accent="cyan"
              icon={<IconClipboardList size={22} />}
            />
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h3 className="font-bold text-zinc-900">
              Assignment performance by subject
            </h3>
            <p className="mb-4 mt-1 text-sm text-zinc-600">
              Topic-linked graded work for{" "}
              <strong className="font-semibold text-zinc-800">
                {analytics.selectedTerm.termName}
              </strong>
              {" · "}
              {analytics.academicCalendar.name}.
            </p>
            {assignmentChartData.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No graded assignments with scores for this term yet.
              </p>
            ) : (
              <BarChart
                h={320}
                data={assignmentChartData}
                dataKey="subject"
                series={[
                  {
                    name: "Average",
                    color: "rgba(79, 70, 229, 0.75)",
                  },
                ]}
                tickLine="y"
                gridAxis="xy"
                withLegend={false}
              />
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h3 className="font-bold text-zinc-900">
              Topics & assignments
            </h3>
            <p className="mb-4 mt-1 text-sm text-zinc-600">
              Each topic lists graded assignments with title, schedule, score,
              modality, and status. Expand a subject to browse topics and
              submissions.
            </p>
            {analytics.subjectAssignmentPerformance.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No topic-linked graded work for this term yet.
              </p>
            ) : (
              <Accordion variant="separated" radius="md">
                {analytics.subjectAssignmentPerformance.map((subj) => (
                  <Accordion.Item
                    key={subj.subjectCatalogId}
                    value={subj.subjectCatalogId}
                  >
                    <Accordion.Control>
                      <div className="flex w-full flex-wrap items-center justify-between gap-2 pr-2">
                        <span className="font-semibold text-zinc-900">
                          {subj.subjectName}
                        </span>
                        <div className="flex items-center gap-3 text-sm text-zinc-600">
                          <span>{subj.gradedCount} graded</span>
                          <Badge variant="light" color="indigo" size="xs">
                            Avg{" "}
                            {subj.averagePercent != null
                              ? `${subj.averagePercent}%`
                              : "—"}
                          </Badge>
                        </div>
                      </div>
                    </Accordion.Control>
                    <Accordion.Panel>
                      {subj.topics.length === 0 ? (
                        <p className="text-sm text-zinc-500">
                          No topics with scores.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-8">
                          {subj.topics.map((t) => (
                            <div key={t.topicId}>
                              <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
                                <span className="font-semibold text-zinc-900">
                                  {t.topicName}
                                </span>
                                <span className="text-zinc-600">
                                  {t.gradedCount} graded
                                  {t.averagePercent != null
                                    ? ` · avg ${t.averagePercent}%`
                                    : ""}
                                </span>
                              </div>
                              <Progress
                                value={t.averagePercent ?? 0}
                                color="violet"
                                radius="xl"
                                size="sm"
                                mb="sm"
                              />
                              <div className="flex flex-col gap-2">
                                {(t.assignments ?? []).map((row) => (
                                  <AssignmentGradeRow
                                    key={row.submissionId}
                                    row={row}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentPerformanceAnalytics;

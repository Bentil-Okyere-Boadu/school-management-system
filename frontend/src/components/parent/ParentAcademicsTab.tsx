"use client";

import { ParentChildHeader } from "@/components/parent/ParentChildHeader";
import { ParentEmptyChildren } from "@/components/parent/ParentEmptyChildren";
import { GradingLegendPanel } from "@/components/common/GradingLegendPanel";
import { GradeBadge } from "@/components/common/GradeBadge";
import {
  averagePercentage,
  overallPerformanceBand,
  performanceBandClass,
} from "@/components/parent/parent-utils";
import type { ParentAcademicsChild } from "@/hooks/parent";
import { HashLoader } from "react-spinners";
import React, { useMemo } from "react";

interface ParentAcademicsTabProps {
  childrenCount: number;
  childrenLoading: boolean;
  academics: ParentAcademicsChild[];
  isLoading: boolean;
  selectedTermName?: string;
}

export const ParentAcademicsTab: React.FC<ParentAcademicsTabProps> = ({
  childrenCount,
  childrenLoading,
  academics,
  isLoading,
  selectedTermName,
}) => {
  if (!childrenCount) {
    return childrenLoading ? <TabLoader /> : <ParentEmptyChildren />;
  }

  if (isLoading && academics.length === 0) {
    return <TabLoader />;
  }

  return (
    <div className="space-y-4">
      {academics.map((child) => (
        <AcademicsCard
          key={child.studentId}
          child={child}
          selectedTermName={selectedTermName}
        />
      ))}
    </div>
  );
};

function AcademicsCard({
  child,
  selectedTermName,
}: {
  child: ParentAcademicsChild;
  selectedTermName?: string;
}) {
  const visibility = child.parentVisibility ?? {
    showScores: true,
    showGrades: true,
    showLabels: true,
    showFeedback: true,
  };

  const terms = useMemo(() => {
    const allTerms = child.results?.terms ?? [];
    if (!selectedTermName) return allTerms;
    const matched = allTerms.filter(
      (term) => term.termName === selectedTermName,
    );
    return matched.length ? matched : [];
  }, [child.results?.terms, selectedTermName]);

  const subjects = terms.flatMap((term) => term.subjects ?? []);
  const avg = averagePercentage(subjects.map((subject) => subject.percentage));
  const band = overallPerformanceBand(avg);
  const pending = child.resultsPending || subjects.length === 0;
  const teacherRemarks =
    terms.find((term) => term.teacherRemarks)?.teacherRemarks ||
    child.results?.teacherRemarks;

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5">
      <ParentChildHeader
        firstName={child.firstName}
        lastName={child.lastName}
        grade={child.grade}
        studentCode={child.studentCode}
        photoUrl={child.photoUrl}
        divider
        actions={
          pending ? (
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
              Results pending
            </span>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {band ? (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${performanceBandClass(band)}`}
                >
                  {band}
                </span>
              ) : null}
              {visibility.showScores && avg != null ? (
                <span className="text-sm font-medium text-zinc-600">
                  {avg}% avg
                </span>
              ) : null}
            </div>
          )
        }
      />

      {pending ? (
        <div className="mt-5 rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center">
          <p className="font-medium text-zinc-600">
            Results for {selectedTermName || "this term"} have not been
            published yet
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Results appear here once the school publishes them.
          </p>
        </div>
      ) : (
        <div className="mt-5">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="py-2 text-left text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    Subject
                  </th>
                  {visibility.showScores && (
                    <th className="py-2 text-left text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      Score
                    </th>
                  )}
                  {visibility.showGrades && (
                    <th className="py-2 text-left text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      Grade
                    </th>
                  )}
                  {visibility.showLabels && (
                    <th className="py-2 text-left text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      Label
                    </th>
                  )}
                  {visibility.showFeedback && (
                    <th className="py-2 text-left text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      Feedback
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr
                    key={subject.subject}
                    className="border-b border-gray-200"
                  >
                    <td className="py-3 text-sm text-[#252C32]">
                      {subject.subject}
                    </td>
                    {visibility.showScores && (
                      <td className="py-3 text-sm text-[#252C32]">
                        {subject.percentage}
                      </td>
                    )}
                    {visibility.showGrades && (
                      <td className="py-3">
                        <GradeBadge grade={subject.grade} />
                      </td>
                    )}
                    {visibility.showLabels && (
                      <td className="py-3 text-sm text-zinc-600">
                        {subject.gradeLabel || subject.bandDescription || "—"}
                      </td>
                    )}
                    {visibility.showFeedback && (
                      <td className="py-3 text-sm text-zinc-600 max-w-[220px]">
                        {subject.feedback || "—"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {teacherRemarks ? (
            <div className="mt-4 rounded-xl bg-zinc-50 px-4 py-3">
              <p className="text-xs font-medium text-zinc-500 mb-1">
                Class teacher remark
              </p>
              <p className="text-sm italic text-zinc-600">{teacherRemarks}</p>
            </div>
          ) : null}
          <GradingLegendPanel
            bands={child.results?.gradingLegend}
            passMark={child.results?.passMark}
          />
        </div>
      )}
    </article>
  );
}

function TabLoader() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <HashLoader color="#AB58E7" size={40} />
    </div>
  );
}

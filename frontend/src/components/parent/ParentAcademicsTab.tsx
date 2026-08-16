"use client";

import CustomButton from "@/components/Button";
import { ParentChildHeader } from "@/components/parent/ParentChildHeader";
import { ParentEmptyChildren } from "@/components/parent/ParentEmptyChildren";
import {
  averagePercentage,
  formatRelativeDate,
  gradeCircleClass,
  gradeRemark,
  overallPerformanceBand,
  performanceBandClass,
} from "@/components/parent/parent-utils";
import type { ParentAcademicsChild } from "@/hooks/parent";
import { IconClipboardCheck } from "@tabler/icons-react";
import { HashLoader } from "react-spinners";
import React, { useMemo } from "react";

interface ParentAcademicsTabProps {
  childrenCount: number;
  childrenLoading: boolean;
  academics: ParentAcademicsChild[];
  isLoading: boolean;
  selectedTermName?: string;
  confirming: boolean;
  onConfirm: (linkId: string) => void;
}

export const ParentAcademicsTab: React.FC<ParentAcademicsTabProps> = ({
  childrenCount,
  childrenLoading,
  academics,
  isLoading,
  selectedTermName,
  confirming,
  onConfirm,
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
          confirming={confirming}
          onConfirm={onConfirm}
        />
      ))}
    </div>
  );
};

function AcademicsCard({
  child,
  selectedTermName,
  confirming,
  onConfirm,
}: {
  child: ParentAcademicsChild;
  selectedTermName?: string;
  confirming: boolean;
  onConfirm: (linkId: string) => void;
}) {
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
              {avg != null ? (
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
            Results appear here once the school approves them.
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
                  <th className="py-2 text-left text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    Score
                  </th>
                  <th className="py-2 text-left text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    Grade
                  </th>
                  <th className="py-2 text-left text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    Remark
                  </th>
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
                    <td className="py-3 text-sm text-[#252C32]">
                      {subject.percentage}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${gradeCircleClass(subject.grade)}`}
                      >
                        {subject.grade}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-zinc-600">
                      {gradeRemark(subject.grade)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {teacherRemarks ? (
            <div className="mt-4 rounded-xl bg-zinc-50 px-4 py-3">
              <p className="text-sm italic text-zinc-600">{teacherRemarks}</p>
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Announcements
          </h3>
          {child.announcements?.length ? (
            <ul className="space-y-3">
              {child.announcements.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl bg-zinc-50 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-neutral-800">
                      {item.title}
                    </p>
                    <p className="shrink-0 text-xs text-zinc-500">
                      {formatRelativeDate(item.createdAt)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">{item.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-200 px-3 py-6 text-sm text-zinc-400">
              No announcements right now.
            </div>
          )}
        </section>
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Required actions
          </h3>
          {child.requiredActions?.length ? (
            <ul className="space-y-3">
              {child.requiredActions.map((action) => (
                <li
                  key={action.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <IconClipboardCheck
                      size={18}
                      className="mt-0.5 shrink-0 text-sky-700"
                    />
                    <p className="text-sm text-neutral-800">{action.message}</p>
                  </div>
                  {action.type === "child_confirmation" ? (
                    <CustomButton
                      text="Complete"
                      variant="outline"
                      onClick={() => onConfirm(action.id)}
                      loading={confirming}
                      className="shrink-0 border-zinc-300 text-zinc-700 hover:bg-white"
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-200 px-3 py-6 text-sm text-zinc-400">
              No forms or approvals waiting on you.
            </div>
          )}
        </section>
      </div>
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

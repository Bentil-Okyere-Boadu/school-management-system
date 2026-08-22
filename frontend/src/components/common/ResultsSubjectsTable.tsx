"use client";

import React from "react";
import { SubjectResult } from "@/@types";
import { GradeBadge } from "@/components/common/GradeBadge";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";

type ColumnKey =
  | "subject"
  | "classScore"
  | "examScore"
  | "percentage"
  | "grade"
  | "label"
  | "feedback";

type Props = {
  subjects: SubjectResult[];
  columns?: ColumnKey[];
  emptyMessage?: string;
};

const DEFAULT_COLUMNS: ColumnKey[] = [
  "subject",
  "classScore",
  "examScore",
  "percentage",
  "grade",
  "label",
  "feedback",
];

const COLUMN_LABELS: Record<ColumnKey, string> = {
  subject: "Subject",
  classScore: "Class score",
  examScore: "Exam score",
  percentage: "Score",
  grade: "Grade",
  label: "Label",
  feedback: "Feedback",
};

export const ResultsSubjectsTable: React.FC<Props> = ({
  subjects,
  columns = DEFAULT_COLUMNS,
  emptyMessage = "No subjects available for this term.",
}) => {
  if (!subjects.length) {
    return (
      <div className="py-8">
        <NoAvailableEmptyState message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="py-2 text-left text-[11px] font-medium uppercase tracking-wide text-zinc-500"
              >
                {COLUMN_LABELS[column]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject) => (
            <tr key={subject.subject} className="border-b border-gray-200">
              {columns.includes("subject") && (
                <td className="py-3 text-sm text-[#252C32]">{subject.subject}</td>
              )}
              {columns.includes("classScore") && (
                <td className="py-3 text-sm text-[#252C32] tabular-nums">
                  {subject.classScore}
                </td>
              )}
              {columns.includes("examScore") && (
                <td className="py-3 text-sm text-[#252C32] tabular-nums">
                  {subject.examScore}
                </td>
              )}
              {columns.includes("percentage") && (
                <td className="py-3 text-sm text-[#252C32] tabular-nums">
                  {subject.percentage}
                </td>
              )}
              {columns.includes("grade") && (
                <td className="py-3">
                  <GradeBadge grade={subject.grade} />
                </td>
              )}
              {columns.includes("label") && (
                <td className="py-3 text-sm text-zinc-600">
                  {subject.gradeLabel || subject.bandDescription || "—"}
                </td>
              )}
              {columns.includes("feedback") && (
                <td className="py-3 text-sm text-zinc-600 max-w-[220px]">
                  {subject.feedback || "—"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

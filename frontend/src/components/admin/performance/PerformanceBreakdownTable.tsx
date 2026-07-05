"use client";

import React from "react";
import { Progress } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import { HashLoader } from "react-spinners";
import type { ClassSubjectPerformanceStudent } from "@/@types";
import {
  CLUSTER_STYLES,
  initialsFromName,
  ordinal,
} from "./performanceClusters";
import ClusterBadge from "./ClusterBadge";

interface PerformanceBreakdownTableProps {
  students: ClassSubjectPerformanceStudent[];
  isLoading?: boolean;
  onRowAction?: (studentId: string) => void;
}

const headerCell =
  "px-6 py-3.5 text-xs font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap border-b border-solid border-b-[#EAECF0] text-left max-md:px-5";

export const PerformanceBreakdownTable: React.FC<
  PerformanceBreakdownTableProps
> = ({ students, isLoading, onRowAction }) => {
  const renderTableBody = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={7}>
            <div className="flex items-center justify-center py-16">
              <HashLoader color="#AB58E7" size={40} />
            </div>
          </td>
        </tr>
      );
    }

    if (students.length === 0) {
      return (
        <tr>
          <td colSpan={7}>
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
              <p className="text-lg font-medium">No students found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting the cluster or score range filters.
              </p>
            </div>
          </td>
        </tr>
      );
    }

    return students.map((student) => {
      const clusterStyle = student.cluster
        ? CLUSTER_STYLES[student.cluster]
        : null;
      const score = student.aggregatedScore;

      return (
        <tr
          key={student.studentId}
          className="hover:bg-gray-50/60 transition-colors"
        >
          <td className="px-6 py-4 border-b border-solid border-b-[#EAECF0] text-sm font-semibold text-zinc-700 whitespace-nowrap max-md:px-5">
            {ordinal(student.rank)}
          </td>

          <td className="px-6 py-4 border-b border-solid border-b-[#EAECF0] max-md:px-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 shrink-0 rounded-full bg-purple-50 text-violet-500 text-sm font-medium flex items-center justify-center">
                {initialsFromName(student.studentName)}
              </div>
              <span className="text-sm text-zinc-800 whitespace-nowrap">
                {student.studentName || "—"}
              </span>
            </div>
          </td>

          <td className="px-6 py-4 border-b border-solid border-b-[#EAECF0] text-sm text-zinc-600 whitespace-nowrap max-md:px-5">
            {student.classLevelName}
          </td>

          <td className="px-6 py-4 border-b border-solid border-b-[#EAECF0] text-sm text-zinc-600 whitespace-nowrap max-md:px-5">
            {student.subjectName}
          </td>

          <td className="px-6 py-4 border-b border-solid border-b-[#EAECF0] max-md:px-5">
            {score === null ? (
              <span className="text-sm text-gray-400">
                No score
              </span>
            ) : (
              <div className="flex items-center gap-3">
                <Progress
                  value={score}
                  color={clusterStyle?.progressColor ?? "violet"}
                  radius="xl"
                  size="sm"
                  className="w-24 shrink-0"
                />
                <span className="text-sm font-semibold text-zinc-800 tabular-nums w-10 text-right">
                  {Math.round(score)}%
                </span>
              </div>
            )}
          </td>

                    <td className="px-6 py-4 border-b border-solid border-b-[#EAECF0] max-md:px-5">
                      <ClusterBadge cluster={student.cluster} />
                    </td>

          <td className="px-6 py-4 border-b border-solid border-b-[#EAECF0] max-md:px-5">
            <div className="flex justify-end">
              <button
                type="button"
                aria-label={`View ${student.studentName} details`}
                onClick={() => onRowAction?.(student.studentId)}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-zinc-500 hover:bg-purple-50 hover:text-violet-600 hover:border-violet-200 transition-colors cursor-pointer"
              >
                <IconArrowRight size={16} />
              </button>
            </div>
          </td>
        </tr>
      );
    });
  };

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[820px]">
          <thead>
            <tr className="bg-gray-50">
              <th className={`${headerCell} w-20`}>Rank</th>
              <th className={headerCell}>Student Name</th>
              <th className={headerCell}>Class</th>
              <th className={headerCell}>Subject</th>
              <th className={`${headerCell} min-w-[200px]`}>Aggregated Score</th>
              <th className={headerCell}>Cluster</th>
              <th className={`${headerCell} text-right`}>Action</th>
            </tr>
          </thead>
          <tbody>{renderTableBody()}</tbody>
        </table>
      </div>
    </section>
  );
};

export default PerformanceBreakdownTable;

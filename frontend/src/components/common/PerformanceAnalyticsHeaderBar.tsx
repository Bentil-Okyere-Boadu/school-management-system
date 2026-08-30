"use client";

import React from "react";
import type { Calendar, Term } from "@/@types";
import { TermFilterCard } from "@/components/common/TermFilterCard";

export type PerformanceAnalyticsHeaderBarProps = {
  calendars: Calendar[];
  calendarsLoading?: boolean;
  sortedTerms: Term[];
  selectedTermId: string;
  onTermChange: (termId: string) => void;
  teacherScoped?: boolean;
  showTermFilter?: boolean;
  description?: string;
  className?: string;
};

export function PerformanceAnalyticsHeaderBar({
  calendars,
  calendarsLoading = false,
  sortedTerms,
  selectedTermId,
  onTermChange,
  teacherScoped = false,
  showTermFilter = true,
  description,
  className,
}: PerformanceAnalyticsHeaderBarProps) {
  const defaultDescription =
    "Assignment outcomes by subject and topic-level averages for one academic period (term + calendar)." +
    (teacherScoped ? " Scoped to subjects you teach this learner." : "");

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-[1px] shadow-lg ${className ?? ""}`}
    >
      <div className="rounded-2xl bg-white/95 px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-zinc-900">
              Performance analytics
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {description ?? defaultDescription}
            </p>
          </div>
          {showTermFilter ? (
            <TermFilterCard
              calendars={calendars ?? []}
              calendarsLoading={calendarsLoading}
              sortedTerms={sortedTerms}
              value={selectedTermId}
              onChange={onTermChange}
              fitFilterGrid
              hideLabel
              className="w-full min-w-0 shrink-0 max-w-95"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

"use client";

import { ParentChildHeader } from "@/components/parent/ParentChildHeader";
import { ParentEmptyChildren } from "@/components/parent/ParentEmptyChildren";
import StudentPerformanceAnalytics from "@/components/common/StudentPerformanceAnalytics";
import type { Calendar } from "@/@types";
import type { ParentPerformanceAnalyticsChild } from "@/hooks/parent";
import { HashLoader } from "react-spinners";
import React from "react";

interface ParentPerformanceAnalyticsTabProps {
  childrenCount: number;
  childrenLoading: boolean;
  performanceAnalytics: ParentPerformanceAnalyticsChild[];
  isLoading: boolean;
  calendars: Calendar[];
  selectedTermId: string;
  onTermChange: (termId: string) => void;
}

export const ParentPerformanceAnalyticsTab: React.FC<
  ParentPerformanceAnalyticsTabProps
> = ({
  childrenCount,
  childrenLoading,
  performanceAnalytics,
  isLoading,
  calendars,
  selectedTermId,
  onTermChange,
}) => {
  if (!childrenCount) {
    return childrenLoading ? <TabLoader /> : <ParentEmptyChildren />;
  }

  if (isLoading && performanceAnalytics.length === 0) {
    return <TabLoader />;
  }

  return (
    <div className="space-y-4">
      {performanceAnalytics.map((child) => (
        <AnalyticsCard
          key={child.studentId}
          child={child}
          calendars={calendars}
          selectedTermId={selectedTermId}
          onTermChange={onTermChange}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};

function AnalyticsCard({
  child,
  calendars,
  selectedTermId,
  onTermChange,
  isLoading,
}: {
  child: ParentPerformanceAnalyticsChild;
  calendars: Calendar[];
  selectedTermId: string;
  onTermChange: (termId: string) => void;
  isLoading: boolean;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <ParentChildHeader
        firstName={child.firstName}
        lastName={child.lastName}
        studentCode={child.studentCode}
        grade={child.grade}
        photoUrl={child.photoUrl}
        divider
      />
      <div className="mt-4">
        <StudentPerformanceAnalytics
          calendars={calendars}
          selectedTermId={selectedTermId}
          onTermChange={onTermChange}
          analytics={child.analytics}
          isLoading={isLoading}
          parentVisibility={child.parentVisibility}
          showHeaderBar={false}
          showTermFilter={false}
          readOnly
        />
      </div>
    </section>
  );
}

function TabLoader() {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <HashLoader color="#AB58E7" size={40} />
    </div>
  );
}

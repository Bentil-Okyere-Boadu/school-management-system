"use client";

import CustomButton from "@/components/Button";
import { ParentAttendanceSheet } from "@/components/parent/ParentAttendanceSheet";
import { ParentChildHeader } from "@/components/parent/ParentChildHeader";
import { ParentEmptyChildren } from "@/components/parent/ParentEmptyChildren";
import type { Term } from "@/@types";
import type { ParentAttendanceChild } from "@/hooks/parent";
import { IconPrinter } from "@tabler/icons-react";
import { HashLoader } from "react-spinners";
import React from "react";

interface ParentAttendanceTabProps {
  childrenCount: number;
  childrenLoading: boolean;
  attendance: ParentAttendanceChild[];
  isLoading: boolean;
  term?: Term;
  onPeriodChange: (month: number, year: number) => void;
}

export const ParentAttendanceTab: React.FC<ParentAttendanceTabProps> = ({
  childrenCount,
  childrenLoading,
  attendance,
  isLoading,
  term,
  onPeriodChange,
}) => {
  if (!childrenCount) {
    return childrenLoading ? <TabLoader /> : <ParentEmptyChildren />;
  }

  if (isLoading && attendance.length === 0) {
    return <TabLoader />;
  }

  return (
    <div className="space-y-4">
      {attendance.map((child) => (
        <article
          key={child.studentId}
          className="rounded-xl border border-zinc-200 bg-white p-5"
        >
          <div className="mb-4">
            <ParentChildHeader
              firstName={child.firstName}
              lastName={child.lastName}
              grade={child.grade}
              studentCode={child.studentCode}
              photoUrl={child.photoUrl}
              divider
              actions={
                <CustomButton
                  text="Full report"
                  variant="outline"
                  icon={<IconPrinter size={16} />}
                  onClick={() => window.print()}
                  className="print:hidden py-[4px] px-[8px] hidden"
                />
              }
            />
          </div>
          <ParentAttendanceSheet
            child={child}
            term={term}
            onPeriodChange={onPeriodChange}
          />
        </article>
      ))}
    </div>
  );
};

function TabLoader() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <HashLoader color="#AB58E7" size={40} />
    </div>
  );
}

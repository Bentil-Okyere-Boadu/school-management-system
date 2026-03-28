"use client";

import React from "react";
import { TermFilterCard } from "@/components/common/TermFilterCard";
import type { Calendar, Term } from "@/@types";

export type TeacherTermSelectProps = {
  calendars: Calendar[];
  calendarsLoading: boolean;
  sortedTerms: Term[];
  academicTermId: string;
  setAcademicTermId: (id: string) => void;
  actions?: React.ReactNode;
  className?: string;
};

export function TeacherTermSelect({
  calendars,
  calendarsLoading,
  sortedTerms,
  academicTermId,
  setAcademicTermId,
  actions,
  className,
}: TeacherTermSelectProps) {
  return (
    <TermFilterCard
      calendars={calendars}
      calendarsLoading={calendarsLoading}
      sortedTerms={sortedTerms}
      value={academicTermId}
      onChange={setAcademicTermId}
      actions={actions}
      className={className}
    />
  );
}

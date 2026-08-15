"use client";

import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import type { ParentChild } from "@/hooks/parent";
import { ALL_CHILDREN_VALUE } from "./parent-utils";
import React from "react";

type Option = { value: string; label: string };

interface ParentFiltersProps {
  wards: ParentChild[];
  selectedStudentId: string;
  onStudentChange: (studentId: string) => void;
  calendarOptions?: Option[];
  selectedCalendarId?: string;
  onCalendarChange?: (calendarId: string) => void;
  termOptions?: Option[];
  selectedTermId?: string;
  onTermChange?: (termId: string) => void;
  extraFilters?: React.ReactNode;
}

export const ParentFilters: React.FC<ParentFiltersProps> = ({
  wards,
  selectedStudentId,
  onStudentChange,
  calendarOptions,
  selectedCalendarId,
  onCalendarChange,
  termOptions,
  selectedTermId,
  onTermChange,
  extraFilters,
}) => {
  const wardOptions = [
    { value: ALL_CHILDREN_VALUE, label: "All wards" },
    ...wards.map((child) => ({
      value: child.id,
      label: `${child.firstName ?? ""} ${child.lastName ?? ""}`.trim() || "Ward",
    })),
  ];

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <CustomSelectTag
          variant="outline"
          options={wardOptions}
          value={selectedStudentId || ALL_CHILDREN_VALUE}
          onOptionItemClick={(event) => onStudentChange(event.target.value)}
          selectClassName="!rounded-lg min-w-[172px]"
        />
        {calendarOptions && onCalendarChange && (
          <CustomSelectTag
            variant="outline"
            options={calendarOptions}
            value={selectedCalendarId}
            onOptionItemClick={(event) => onCalendarChange(event.target.value)}
            selectClassName="!rounded-lg"
          />
        )}
        {termOptions && onTermChange && (
          <CustomSelectTag
            variant="outline"
            options={termOptions}
            value={selectedTermId}
            onOptionItemClick={(event) => onTermChange(event.target.value)}
            selectClassName="!rounded-lg"
          />
        )}
        {extraFilters}
      </div>
      <p className="text-xs text-zinc-400">Filters apply to every tab.</p>
    </div>
  );
};

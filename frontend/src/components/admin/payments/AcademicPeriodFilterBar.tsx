"use client";

import type { Calendar } from "@/@types";
import { buildTermSelectData } from "@/utils/schoolTerms";
import { Badge, Combobox, Select } from "@mantine/core";
import React, { useMemo } from "react";

interface AcademicPeriodFilterBarProps {
  calendars: Calendar[];
  scopedTerms: Array<{ id: string; termName: string }>;
  calendarId: string;
  termId: string;
  latestTermId: string;
  calendarsLoading?: boolean;
  onCalendarChange: (calendarId: string) => void;
  onTermChange: (termId: string) => void;
}

export const AcademicPeriodFilterBar: React.FC<AcademicPeriodFilterBarProps> = ({
  calendars,
  scopedTerms,
  calendarId,
  termId,
  latestTermId,
  calendarsLoading = false,
  onCalendarChange,
  onTermChange,
}) => {
  const calendarOptions = useMemo(
    () =>
      calendars.map((calendar) => ({
        value: calendar.id,
        label: calendar.name,
      })),
    [calendars]
  );

  const termSelectData = useMemo(
    () => buildTermSelectData(calendars, scopedTerms),
    [calendars, scopedTerms]
  );

  const showLatestInSelect = Boolean(
    latestTermId && termId === latestTermId
  );

  const termSelectRightSection = useMemo(
    () => (
      <div className="flex items-center justify-end gap-1.5 pr-0.5">
        {showLatestInSelect && (
          <Badge
            variant="light"
            size="xs"
            className="shrink-0 font-semibold"
            style={{ backgroundColor: "#F3E8FF", color: "#6B21A8" }}
          >
            Latest
          </Badge>
        )}
        <Combobox.Chevron size="sm" />
      </div>
    ),
    [showLatestInSelect]
  );

  if (calendarsLoading && calendars.length === 0) {
    return null;
  }

  return (
    <div className="mb-5 flex flex-wrap items-end gap-3 px-0.5">
      <div className="w-full max-w-[240px] min-w-[180px]">
        <Select
          label="Academic year"
          placeholder="Select year"
          data={calendarOptions}
          value={calendarId || null}
          onChange={(value) => {
            if (value) onCalendarChange(value);
          }}
          searchable
          disabled={calendarOptions.length === 0}
          comboboxProps={{ withinPortal: true }}
        />
      </div>
      <div className="w-full max-w-[320px] min-w-[200px]">
        <Select
          label="Term"
          placeholder={scopedTerms.length ? "Select term" : "No terms available"}
          data={termSelectData}
          value={termId || null}
          onChange={(value) => {
            if (value) onTermChange(value);
          }}
          searchable
          disabled={scopedTerms.length === 0}
          rightSection={termSelectRightSection}
          rightSectionWidth={showLatestInSelect ? 118 : undefined}
          comboboxProps={{ withinPortal: true }}
        />
      </div>
    </div>
  );
};

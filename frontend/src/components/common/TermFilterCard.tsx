"use client";

import React, { useMemo } from "react";
import { Badge, Combobox, Select } from "@mantine/core";
import type { Calendar, Term } from "@/@types";

export type TermFilterCardProps = {
  calendars: Calendar[];
  calendarsLoading?: boolean;
  sortedTerms: Term[];
  value: string;
  onChange: (id: string) => void;
  /** Right side (e.g. primary action buttons). */
  actions?: React.ReactNode;
  className?: string;
  /**
   * When true, drop outer margin and max-width so the term select sits in the
   * same CSS grid row as other Mantine filter fields (e.g. curriculum progress).
   */
  fitFilterGrid?: boolean;
};

/**
 * Term picker row: `max-w-[320px]` select, Latest badge + chevron, optional actions.
 */
export function TermFilterCard({
  calendars,
  calendarsLoading = false,
  sortedTerms,
  value,
  onChange,
  actions,
  className,
  fitFilterGrid = false,
}: TermFilterCardProps) {
  const latestTermId = sortedTerms[0]?.id;

  const termSelectData = useMemo(
    () =>
      sortedTerms.map((t) => {
        const cal = calendars.find((c) =>
          c.terms?.some((term) => term.id === t.id),
        );
        const label = cal ? `${t.termName} — ${cal.name}` : t.termName;
        return { value: t.id, label };
      }),
    [sortedTerms, calendars],
  );

  const showLatestInSelect = Boolean(latestTermId && value === latestTermId);

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
    [showLatestInSelect],
  );

  const disabled = calendarsLoading || sortedTerms.length === 0;

  return (
    <div
      className={`flex flex-col gap-4 px-0.5 ${fitFilterGrid ? "mb-0 w-full min-w-0" : "mb-5 lg:flex-row lg:items-end lg:justify-between"} ${className ?? ""}`}
    >
      <div
        className={
          fitFilterGrid
            ? "w-full min-w-0"
            : "w-full max-w-[320px] min-w-[200px]"
        }
      >
        <Select
          label="Select term"
          placeholder={
            calendarsLoading
              ? "Loading…"
              : sortedTerms.length
                ? "Select term"
                : "No terms available"
          }
          data={termSelectData}
          value={value}
          onChange={(v) => onChange(v ?? "")}
          searchable
          disabled={disabled}
          className="w-full"
          rightSection={termSelectRightSection}
          rightSectionWidth={showLatestInSelect ? 118 : undefined}
        />
      </div>
      {actions ? (
        <div
          className={`flex flex-wrap gap-2 ${fitFilterGrid ? "justify-start" : "lg:justify-end"}`}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}

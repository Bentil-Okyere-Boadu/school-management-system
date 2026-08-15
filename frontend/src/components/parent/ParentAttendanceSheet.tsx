"use client";

import type { ParentAttendanceChild } from "@/hooks/parent";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import {
  attendancePeriodOptions,
  parsePeriodValue,
  periodValue,
} from "./parent-utils";
import type { Term } from "@/@types";
import Cancel from "@/images/Cancel.svg";
import Mark from "@/images/Mark.svg";
import Image from "next/image";
import React from "react";

interface ParentAttendanceSheetProps {
  child: ParentAttendanceChild;
  term?: Term;
  onPeriodChange: (month: number, year: number) => void;
}

export const ParentAttendanceSheet: React.FC<ParentAttendanceSheetProps> = ({
  child,
  term,
  onPeriodChange,
}) => {
  const periodOptions = attendancePeriodOptions(term, child.year);

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Days recorded" value={String(child.daysRecorded)} />
        <MiniStat
          label="Present"
          value={String(child.presentCount)}
          valueClassName="text-purple-500"
        />
        <MiniStat
          label="Absent"
          value={String(child.absentCount)}
          valueClassName="text-sky-500"
        />
        <MiniStat
          label="Attendance rate"
          value={`${child.attendanceRate}%`}
          valueClassName="text-teal-600"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Attendance sheet
        </h3>
        <CustomSelectTag
          variant="outline"
          options={periodOptions}
          value={periodValue(child.month, child.year)}
          onOptionItemClick={(event) => {
            const next = parsePeriodValue(event.target.value);
            if (!next) return;
            onPeriodChange(next.month, next.year);
          }}
        />
      </div>

      <div className="mt-3 overflow-x-auto">
        <div className="min-w-fit">
          <div
            className="grid min-w-fit"
            style={{
              gridTemplateColumns: `repeat(${child.days.length || 0}, 3rem)`,
            }}
          >
            {child.days.map((day) => (
              <div
                key={`label-${day.date}`}
                className="bg-blue-50 px-2 py-5 text-center text-xs font-medium text-gray-500"
              >
                {day.day}
              </div>
            ))}
            <React.Fragment key={child.studentId}>
              {child.days.map((day) => {
                const status = day.status;
                const present = status === "present";
                const isWeekend = status === "weekend";
                const isHoliday = status === "holiday";
                const icon =
                  status == null || status === "none" || isWeekend
                    ? null
                    : present
                      ? Mark
                      : Cancel;
                const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
                const isCalendarWeekend = weekday === 0 || weekday === 6;

                return (
                  <div
                    key={day.date}
                    className={`px-2 py-5 border-b border-gray-200 flex items-center justify-center ${
                      isCalendarWeekend
                        ? "bg-white pointer-events-none"
                        : "bg-[#F9F5FF]"
                    } ${isHoliday ? "bg-[#FCEBCF] pointer-events-none" : ""}`}
                  >
                    {isHoliday ? (
                      <span className="text-[11px] font-bold text-black-500 rotate-[-45deg] whitespace-nowrap">
                        Holiday
                      </span>
                    ) : icon ? (
                      <Image
                        src={icon}
                        alt={present ? "Present" : "Absent"}
                        className="w-5 h-5 object-contain"
                        width={20}
                        height={20}
                      />
                    ) : (
                      <span className="text-xs text-gray-300">–</span>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Green check = present · Red X = absent · Dash = weekend or no record ·
        Holiday = school holiday
      </p>
    </div>
  );
};

function MiniStat({
  label,
  value,
  valueClassName = "text-neutral-800",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-2.5 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className={`text-lg font-semibold tabular-nums ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}

"use client";

import React, { useMemo } from "react";
import { Tooltip } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import type { ClassSubjectPerformanceStudent } from "@/@types";
import { CLUSTER_STYLES } from "./performanceClusters";
import { formatPercent } from "@/utils/formatPercent";

const DOT_W = 18; // dot width (px)
const DOT_H = 18; // dot height (px)
const COLLIDE = 18; // min horizontal gap before dots stack (px)
const LANE_STEP = 18; // vertical distance between stacked dots (px)
const X_PAD = 20; // horizontal padding so edge dots aren't clipped
const AXIS_H = 32; // space for x-axis tick labels
const TOP_PAD = 30; // space for the median label
const TICKS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const MIN_PLOT_H = 180; // minimum height of the dot area (px)

type Placed = {
  x: number;
  lane: number;
  student: ClassSubjectPerformanceStudent;
};

interface ScoreDistributionChartProps {
  students: ClassSubjectPerformanceStudent[];
  median: number | null;
  classAverage: number | null;
}

export default function ScoreDistributionChart({
  students,
  median,
  classAverage,
}: ScoreDistributionChartProps) {
  const { ref, width } = useElementSize();
  const plotWidth = Math.max(0, width - X_PAD * 2);

  const clamp = (n: number) => Math.min(100, Math.max(0, n));
  const xFor = (score: number) => X_PAD + (clamp(score) / 100) * plotWidth;

  const placed = useMemo<Placed[]>(() => {
    if (plotWidth <= 0) return [];
    const withScore = students
      .filter((s) => s.aggregatedScore !== null)
      .sort((a, b) => a.aggregatedScore! - b.aggregatedScore!);

    const result: Placed[] = [];
    for (const student of withScore) {
      const x = X_PAD + (clamp(student.aggregatedScore!) / 100) * plotWidth;
      let lane = 0;
      while (
        result.some((p) => p.lane === lane && Math.abs(p.x - x) < COLLIDE)
      ) {
        lane++;
      }
      result.push({ x, lane, student });
    }
    return result;
  }, [students, plotWidth]);

  const scoredCount = placed.length;

  const maxLane = placed.reduce((m, p) => Math.max(m, p.lane), 0);
  const plotHeight = Math.max(MIN_PLOT_H, maxLane * LANE_STEP + DOT_H);
  const totalHeight = TOP_PAD + plotHeight + AXIS_H;
  const laneZeroTop = TOP_PAD + plotHeight - DOT_H; // top of the bottom-most dot
  const axisTop = TOP_PAD + plotHeight;

  const hasScoredStudents = useMemo(
  () => students.some((s) => s.aggregatedScore !== null),
  [students]
);

  if (!hasScoredStudents) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/60 py-12 text-sm text-zinc-500">
        No scored students to plot for this selection.
      </div>
    );
  }

  return (
    <div>
      <div ref={ref} className="relative w-full" style={{ height: totalHeight }}>
        {/* x-axis baseline */}
        <div
          className="absolute left-0 right-0 border-t border-gray-200"
          style={{ top: axisTop }}
        />

        {/* median line + label */}
        {median !== null && plotWidth > 0 && (
          <>
            <div
              className="absolute border-l border-dashed border-violet-400"
              style={{
                left: xFor(median),
                top: TOP_PAD - 4,
                height: plotHeight + 4,
              }}
            />
            <div
              className="absolute -translate-x-1/2 whitespace-nowrap text-xs font-medium text-violet-600"
              style={{ left: xFor(median), top: 0 }}
            >
              Median {formatPercent(median, "")}
            </div>
          </>
        )}

        {/* tick labels */}
        {plotWidth > 0 &&
          TICKS.map((t) => (
            <div
              key={t}
              className="absolute -translate-x-1/2 text-[11px] text-gray-400"
              style={{ left: xFor(t), top: axisTop + 8 }}
            >
              {t}
            </div>
          ))}

        {/* dots */}
        {placed.map(({ x, lane, student }) => {
          const dotClass = student.cluster
            ? CLUSTER_STYLES[student.cluster].dotClass
            : "bg-gray-400";
          return (
            <Tooltip
              key={student.studentId}
              withArrow
              label={
                <div className="text-xs leading-relaxed">
                  <p className="font-semibold">{student.studentName}</p>
                  <p>Score: {formatPercent(student.aggregatedScore)}</p>
                  <p>{student.cluster ?? "Unranked"}</p>
                </div>
              }
            >
              <div
                className={`absolute rounded-full ring-2 ring-white cursor-pointer transition-transform hover:z-10 hover:scale-110 ${dotClass}`}
                style={{
                  width: DOT_W,
                  height: DOT_H,
                  left: x - DOT_W / 2,
                  top: laneZeroTop - lane * LANE_STEP,
                }}
              />
            </Tooltip>
          );
        })}
      </div>

      {/* footer captions */}
      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
        <span>
          Each dot represents one student · {scoredCount} student
          {scoredCount === 1 ? "" : "s"}
        </span>
        {classAverage !== null && (
          <span>
            Class average:{" "}
            <span className="font-semibold text-zinc-700">
              {formatPercent(classAverage)}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
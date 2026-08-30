"use client";

import React from "react";
import { GradingLegendBand } from "@/@types";

type Props = {
  bands?: GradingLegendBand[];
  passMark?: number;
  title?: string;
};

export const GradingLegendPanel: React.FC<Props> = ({
  bands = [],
  passMark,
  title = "Grading scale",
}) => {
  if (!bands.length) return null;

  return (
    <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
        {passMark !== undefined && (
          <span className="text-xs text-neutral-600">
            Pass mark: {passMark}%
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-xs">
          <thead>
            <tr className="text-left text-neutral-500">
              <th className="pb-2 pr-3 font-medium">Grade</th>
              <th className="pb-2 pr-3 font-medium">Label</th>
              <th className="pb-2 pr-3 font-medium">Range</th>
              <th className="pb-2 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {bands.map((band) => (
              <tr key={`${band.code}-${band.minScore}`} className="border-t border-neutral-200">
                <td className="py-2 pr-3 font-semibold text-neutral-800">
                  {band.code}
                </td>
                <td className="py-2 pr-3 text-neutral-700">{band.label}</td>
                <td className="py-2 pr-3 tabular-nums text-neutral-700">
                  {band.minScore}–{band.maxScore}
                </td>
                <td className="py-2 text-neutral-600">
                  {band.description || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

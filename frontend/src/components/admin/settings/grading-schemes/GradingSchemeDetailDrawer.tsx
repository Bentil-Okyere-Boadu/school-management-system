"use client";

import React from "react";
import { GradingScheme } from "@/@types";
import { IconX } from "@tabler/icons-react";

type Props = {
  scheme: GradingScheme | null;
  onClose: () => void;
  onActivate: (scheme: GradingScheme) => void;
  onDeactivate: (scheme: GradingScheme) => void;
  onDelete: (scheme: GradingScheme) => void;
  onNewVersion: (scheme: GradingScheme) => void;
  onEdit: (scheme: GradingScheme) => void;
};

function formatWhen(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const GradingSchemeDetailDrawer: React.FC<Props> = ({
  scheme,
  onClose,
  onActivate,
  onDeactivate,
  onDelete,
  onNewVersion,
  onEdit,
}) => {
  if (!scheme) return null;

  const classesUsing =
    scheme.scopeType === "school"
      ? "All classes (school-wide)"
      : (scheme.classLevels ?? [])
          .map((level) => level.name)
          .join(", ") || "No class levels selected";

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              {scheme.name}
            </h2>
            <p className="mt-0.5 text-sm text-neutral-500 capitalize">
              {scheme.status} · v{scheme.version}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 cursor-pointer"
            aria-label="Close"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          <section className="space-y-2 text-sm">
            <h3 className="font-semibold text-neutral-900">Rules</h3>
            <p>
              Scale: {scheme.scoreScaleMin}–{scheme.scoreScaleMax}
            </p>
            <p>Pass mark: {scheme.passMark}</p>
            <p className="capitalize">Rounding: {scheme.rounding}</p>
            <p>
              Manual override:{" "}
              {scheme.allowManualOverride ? "Allowed" : "Not allowed"}
            </p>
            <p>Effective from: {scheme.effectiveFrom || "—"}</p>
            <p>Classes using: {classesUsing}</p>
            {scheme.usedByClassCount >= 0 && (
              <p className="text-neutral-500">
                Impact: {scheme.usedByClassCount} class level(s) in scope
              </p>
            )}
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-neutral-900">Grade bands</h3>
            <div className="overflow-hidden rounded-lg border border-neutral-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-3 py-2 text-left font-medium text-neutral-600">
                      Code
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-neutral-600">
                      Label
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-neutral-600">
                      Range
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(scheme.bands ?? []).map((band) => (
                    <tr
                      key={`${band.code}-${band.minScore}`}
                      className="border-b border-neutral-100 last:border-0"
                    >
                      <td className="px-3 py-2 font-medium">{band.code}</td>
                      <td className="px-3 py-2">
                        <div>{band.label}</div>
                        {band.description && (
                          <div className="text-xs text-neutral-500">
                            {band.description}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {band.minScore}–{band.maxScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(scheme.gapWarnings ?? []).length > 0 && (
              <div className="mt-2 rounded-md bg-amber-50 text-amber-800 text-xs p-2 space-y-1">
                {scheme.gapWarnings.map((warn) => (
                  <p key={warn}>{warn}</p>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-2 text-sm">
            <h3 className="font-semibold text-neutral-900">Audit</h3>
            <p>
              Created by {scheme.createdByName || "—"} ·{" "}
              {formatWhen(scheme.createdAt)}
            </p>
            <p>
              Updated by {scheme.updatedByName || "—"} ·{" "}
              {formatWhen(scheme.updatedAt)}
            </p>
            <p>
              Activated by {scheme.activatedByName || "—"} ·{" "}
              {formatWhen(scheme.activatedAt)}
            </p>
          </section>

          <section className="flex flex-wrap gap-2">
            {scheme.status === "draft" && (
              <button
                type="button"
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm cursor-pointer hover:bg-neutral-50"
                onClick={() => onEdit(scheme)}
              >
                Edit draft
              </button>
            )}
            {scheme.status !== "active" && (
              <button
                type="button"
                className="rounded-lg bg-purple-600 text-white px-3 py-1.5 text-sm cursor-pointer hover:bg-purple-700"
                onClick={() => onActivate(scheme)}
              >
                Activate
              </button>
            )}
            {scheme.status === "active" && (
              <>
                <button
                  type="button"
                  className="rounded-lg border border-amber-300 text-amber-800 px-3 py-1.5 text-sm cursor-pointer hover:bg-amber-50"
                  onClick={() => onDeactivate(scheme)}
                >
                  Deactivate
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm cursor-pointer hover:bg-neutral-50"
                  onClick={() => onNewVersion(scheme)}
                >
                  Create new version
                </button>
              </>
            )}
            {scheme.status !== "active" && (
              <button
                type="button"
                className="rounded-lg border border-red-300 text-red-700 px-3 py-1.5 text-sm cursor-pointer hover:bg-red-50"
                onClick={() => onDelete(scheme)}
              >
                Delete
              </button>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
};

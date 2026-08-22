"use client";

import React from "react";
import { Dialog } from "@/components/common/Dialog";
import { GradeBadge } from "@/components/common/GradeBadge";
import { GradePreviewRow } from "@/utils/gradePreview";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  rows: GradePreviewRow[];
  busy?: boolean;
  invalidCount: number;
  missingCount: number;
};

export const GradingPreviewDialog: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  rows,
  busy = false,
  invalidCount,
  missingCount,
}) => {
  const canSubmit = invalidCount === 0;

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      dialogTitle="Preview results before submit"
      subheader="Review scores, computed grades, labels, and feedback."
      saveButtonText={canSubmit ? "Submit results" : "Fix invalid scores"}
      onSave={canSubmit ? onConfirm : onClose}
      busy={busy}
      saveDisabled={busy || !canSubmit}
      dialogWidth="w-[920px] max-w-[95vw]"
    >
      <div className="space-y-4 px-1 max-h-[60vh] overflow-y-auto">
        {(invalidCount > 0 || missingCount > 0) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 space-y-1">
            {invalidCount > 0 && (
              <p>
                {invalidCount} student(s) have invalid scores (out of range).
              </p>
            )}
            {missingCount > 0 && (
              <p>
                {missingCount} student(s) have missing scores. You can still
                submit after confirming if only scores are missing.
              </p>
            )}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-3 py-2 text-left font-medium text-neutral-600">
                  Student
                </th>
                <th className="px-3 py-2 text-right font-medium text-neutral-600">
                  Class
                </th>
                <th className="px-3 py-2 text-right font-medium text-neutral-600">
                  Exam
                </th>
                <th className="px-3 py-2 text-right font-medium text-neutral-600">
                  Total
                </th>
                <th className="px-3 py-2 text-left font-medium text-neutral-600">
                  Grade
                </th>
                <th className="px-3 py-2 text-left font-medium text-neutral-600">
                  Label
                </th>
                <th className="px-3 py-2 text-left font-medium text-neutral-600">
                  Feedback
                </th>
                <th className="px-3 py-2 text-left font-medium text-neutral-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.studentId}
                  className={`border-b border-neutral-100 ${
                    row.isInvalid
                      ? "bg-red-50"
                      : row.isMissing
                        ? "bg-amber-50"
                        : ""
                  }`}
                >
                  <td className="px-3 py-2">
                    {row.firstName} {row.lastName}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {row.classScore ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {row.examScore ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {row.totalScore ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-medium">
                    <GradeBadge grade={row.grade} size="sm" />
                  </td>
                  <td className="px-3 py-2">{row.gradeLabel ?? "—"}</td>
                  <td className="px-3 py-2 text-neutral-600 max-w-[180px] truncate">
                    {row.feedback || "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {row.isInvalid ? (
                      <span className="text-red-700">Invalid</span>
                    ) : row.isMissing ? (
                      <span className="text-amber-800">Missing</span>
                    ) : (
                      <span className="text-emerald-700">Ready</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Dialog>
  );
};

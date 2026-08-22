"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAdminCheckResults,
  useAdminPublishResults,
  useAdminReturnResults,
  useAdminResultsReview,
  useGetAllSubjects,
  useGetCalendars,
  useGetClassLevels,
} from "@/hooks/school-admin";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import CustomButton from "@/components/Button";
import { Dialog } from "@/components/common/Dialog";
import { toast } from "react-toastify";
import { GradeBadge } from "@/components/common/GradeBadge";
import { HashLoader } from "react-spinners";
import { getSortedSchoolTerms } from "@/utils/schoolTerms";
import { IconArrowLeft } from "@tabler/icons-react";

type ReviewRow = {
  studentId: string;
  studentName: string;
  classLevelId: string;
  className: string;
  subjectName: string;
  teacherName: string;
  totalScore: number;
  grade: string;
  gradeLabel?: string | null;
  feedback?: string | null;
  isInvalid?: boolean;
  isMissing?: boolean;
  hasOverride?: boolean;
};

const TABLE_HEADERS: {
  key: string;
  label: string;
  align?: "left" | "right";
  headerClass?: string;
  cellClass?: string;
}[] = [
  { key: "student", label: "Student", cellClass: "pr-3" },
  { key: "class", label: "Class", cellClass: "pr-3" },
  { key: "subject", label: "Subject", cellClass: "pr-3" },
  { key: "teacher", label: "Teacher", cellClass: "pr-3" },
  {
    key: "total",
    label: "Total",
    align: "right",
    headerClass: "pr-10",
    cellClass: "pr-10 whitespace-nowrap",
  },
  {
    key: "grade",
    label: "Grade",
    headerClass: "pl-4",
    cellClass: "pl-4",
  },
  { key: "label", label: "Label", cellClass: "pl-2" },
  { key: "feedback", label: "Feedback", cellClass: "pl-2" },
];

function rowIssue(row: ReviewRow): string | null {
  if (row.isInvalid) return "Invalid grade or score";
  if (row.isMissing) return "Missing required data";
  if (row.hasOverride) return "Manual grade override applied";
  return null;
}

function rowHighlightClass(row: ReviewRow): string {
  if (row.isInvalid) return "bg-red-50/60";
  if (row.isMissing) return "bg-amber-50/60";
  if (row.hasOverride) return "bg-violet-50/40";
  return "";
}

export default function AdminResultsReviewPage() {
  const router = useRouter();
  const [classLevelId, setClassLevelId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [termId, setTermId] = useState("");
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnNote, setReturnNote] = useState("");
  const [returnTarget, setReturnTarget] = useState<{
    classLevelId: string;
    academicTermId: string;
  } | null>(null);

  const { classLevels } = useGetClassLevels();
  const { subjects } = useGetAllSubjects();
  const { calendars } = useGetCalendars();
  const sortedTerms = useMemo(
    () => getSortedSchoolTerms(calendars ?? []),
    [calendars],
  );

  const selectedTermName = sortedTerms.find((t) => t.id === termId)?.termName;

  const { review, isLoading, refetch } = useAdminResultsReview({
    classLevelId: classLevelId || undefined,
    subjectId: subjectId || undefined,
    academicTermId: termId || undefined,
  });

  const { mutate: checkResults, isPending: checking } = useAdminCheckResults();
  const { mutate: publishResults, isPending: publishing } =
    useAdminPublishResults();
  const { mutate: returnResults, isPending: returning } =
    useAdminReturnResults();

  const rows: ReviewRow[] = review?.rows ?? [];
  const actionBusy = checking || publishing || returning;

  const handleCheck = (targetClassLevelId: string) => {
    if (!termId) {
      toast.error("Select a term first");
      return;
    }
    checkResults(
      { classLevelId: targetClassLevelId, academicTermId: termId },
      {
        onSuccess: () => {
          toast.success("Results checked and approved");
          refetch();
        },
        onError: (err: unknown) =>
          toast.error(
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Failed to check results",
          ),
      },
    );
  };

  const handlePublish = (targetClassLevelId: string) => {
    if (!termId) {
      toast.error("Select a term first");
      return;
    }
    publishResults(
      { classLevelId: targetClassLevelId, academicTermId: termId },
      {
        onSuccess: () => {
          toast.success("Results published");
          refetch();
        },
        onError: (err: unknown) =>
          toast.error(
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Failed to publish results",
          ),
      },
    );
  };

  const openReturn = (targetClassLevelId: string) => {
    if (!termId) {
      toast.error("Select a term first");
      return;
    }
    setReturnTarget({ classLevelId: targetClassLevelId, academicTermId: termId });
    setReturnNote("");
    setReturnOpen(true);
  };

  const confirmReturn = () => {
    if (!returnTarget || !returnNote.trim()) {
      toast.error("Return note is required");
      return;
    }
    returnResults(
      {
        classLevelId: returnTarget.classLevelId,
        academicTermId: returnTarget.academicTermId,
        returnNote: returnNote.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Results returned to teacher");
          setReturnOpen(false);
          refetch();
        },
        onError: (err: unknown) =>
          toast.error(
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Failed to return results",
          ),
      },
    );
  };

  const uniqueClasses = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((row) => {
      map.set(row.classLevelId, row.className);
    });
    return Array.from(map.entries());
  }, [rows]);

  return (
    <div className="pb-8">
      <button
        type="button"
        onClick={() => router.push("/admin/classes")}
        className="mb-5 flex items-center gap-2 text-sm font-medium text-purple-600 transition-colors hover:text-purple-800"
      >
        <IconArrowLeft size={18} stroke={1.75} />
        Back to classes
      </button>

      <div className="mb-5">
        <h1 className="text-lg font-semibold text-neutral-800">Results review</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Review submitted scores, grades, labels, and feedback before publishing.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <CustomSelectTag
          value={termId}
          options={[
            { label: "Academic term", value: "" },
            ...sortedTerms.map((t) => ({ label: t.termName, value: t.id })),
          ]}
          onOptionItemClick={(e) =>
            setTermId((e.target as HTMLSelectElement).value)
          }
        />
        <CustomSelectTag
          value={classLevelId}
          options={[
            { label: "All classes", value: "" },
            ...(classLevels ?? []).map((c) => ({
              label: c.name,
              value: c.id,
            })),
          ]}
          onOptionItemClick={(e) =>
            setClassLevelId((e.target as HTMLSelectElement).value)
          }
        />
        <CustomSelectTag
          value={subjectId}
          options={[
            { label: "All subjects", value: "" },
            ...(subjects ?? []).map(
              (s: {
                id: string;
                subjectCatalog?: { name?: string };
                name?: string;
              }) => ({
                label: s.subjectCatalog?.name ?? s.name ?? "Subject",
                value: s.id,
              }),
            ),
          ]}
          onOptionItemClick={(e) =>
            setSubjectId((e.target as HTMLSelectElement).value)
          }
        />
      </div>

      {uniqueClasses.length > 0 && termId ? (
        <div className="mb-5 flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Class actions
            {selectedTermName ? ` · ${selectedTermName}` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {uniqueClasses.map(([id, name]) => (
              <div
                key={id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2"
              >
                <span className="text-sm font-medium text-neutral-800">
                  {name}
                </span>
                <CustomButton
                  text="Check"
                  onClick={() => handleCheck(id)}
                  disabled={actionBusy}
                />
                <CustomButton
                  text="Publish"
                  onClick={() => handlePublish(id)}
                  disabled={actionBusy}
                />
                <CustomButton
                  text="Return"
                  onClick={() => openReturn(id)}
                  disabled={actionBusy}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <article className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <HashLoader color="#AB58E7" size={36} />
            </div>
          ) : (
            <table className="w-full min-w-[880px] table-fixed border-collapse">
              <colgroup>
                <col className="w-[16%]" />
                <col className="w-[11%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
                <col className="w-[9%]" />
                <col className="w-[21%]" />
              </colgroup>
              <thead>
                <tr>
                  {TABLE_HEADERS.map((header) => (
                    <th
                      key={header.key}
                      className={`py-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500 ${
                        header.align === "right"
                          ? "text-right"
                          : "text-left"
                      } ${header.headerClass ?? ""}`}
                    >
                      {header.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((row) => {
                    const issue = rowIssue(row);
                    return (
                      <tr
                        key={`${row.studentId}-${row.subjectName}`}
                        className={`border-b border-gray-200 ${rowHighlightClass(row)}`}
                        title={issue ?? undefined}
                      >
                        <td className={`py-3 text-sm text-[#252C32] ${TABLE_HEADERS[0].cellClass}`}>
                          <span className="block truncate">{row.studentName}</span>
                        </td>
                        <td className={`py-3 text-sm text-zinc-600 ${TABLE_HEADERS[1].cellClass}`}>
                          <span className="block truncate">{row.className}</span>
                        </td>
                        <td className={`py-3 text-sm text-[#252C32] ${TABLE_HEADERS[2].cellClass}`}>
                          <span className="block truncate">{row.subjectName}</span>
                        </td>
                        <td className={`py-3 text-sm text-zinc-600 ${TABLE_HEADERS[3].cellClass}`}>
                          <span className="block truncate">{row.teacherName}</span>
                        </td>
                        <td
                          className={`py-3 text-right text-sm tabular-nums text-[#252C32] ${TABLE_HEADERS[4].cellClass}`}
                        >
                          {row.totalScore}
                        </td>
                        <td className={`py-3 ${TABLE_HEADERS[5].cellClass}`}>
                          <GradeBadge grade={row.grade} size="sm" />
                        </td>
                        <td className={`py-3 text-sm text-zinc-600 ${TABLE_HEADERS[6].cellClass}`}>
                          {row.gradeLabel || "—"}
                        </td>
                        <td className={`py-3 text-sm text-zinc-600 ${TABLE_HEADERS[7].cellClass}`}>
                          <span className="line-clamp-2">{row.feedback || "—"}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-12 text-center text-sm text-zinc-500"
                    >
                      {termId
                        ? "No submitted results match these filters."
                        : "Select an academic term to review results."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </article>

      <Dialog
        isOpen={returnOpen}
        onClose={() => setReturnOpen(false)}
        dialogTitle="Return results for correction"
        subheader="Teachers will be able to edit and resubmit."
        saveButtonText="Return to teacher"
        onSave={confirmReturn}
        busy={returning}
      >
        <textarea
          value={returnNote}
          onChange={(e) => setReturnNote(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
          placeholder="Explain what needs to be corrected"
        />
      </Dialog>
    </div>
  );
}

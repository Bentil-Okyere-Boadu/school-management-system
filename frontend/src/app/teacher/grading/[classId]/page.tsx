"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import CustomButton from "@/components/Button";
import { Pagination } from "@/components/common/Pagination";
import TableInputField from "@/components/common/TableInputField";
import { Dialog } from "@/components/common/Dialog";
import { GradeBadge } from "@/components/common/GradeBadge";
import { GradingPreviewDialog } from "@/components/teacher/grading/GradingPreviewDialog";
import {
  useGetCalendars,
  useGetStudentsForGrading,
  useGetSubjectClasses,
  useGetTeacherClassResultsApprovalStatus,
  usePostStudentGrades,
  useTeacherGetMe,
} from "@/hooks/teacher";
import { ErrorResponse, PostGradesPayload, StudentsForGradingResponse } from "@/@types";
import { toast } from "react-toastify";
import { HashLoader } from "react-spinners";
import { Badge, Combobox, Select } from "@mantine/core";
import { getSortedSchoolTerms } from "@/utils/schoolTerms";
import {
  buildGradePreviewRows,
  validateGradingRow,
} from "@/utils/gradePreview";

type StudentGrading = {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  isArchived?: boolean;
  archivedAt?: string | null;
  classScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  feedback: string;
  status: "draft" | "submitted" | null;
};

function parseEditableScore(value: string): number | null {
  const t = value.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function formatScoreForInput(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) return "";
  return String(score);
}

const ClassGrading = () => {
  const { classId } = useParams();

  const [studentScores, setStudentScores] = useState<StudentGrading[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmMissingOpen, setConfirmMissingOpen] = useState(false);

  const [currentTerm, setCurrentTerm] = useState("");
  const [currentAcademicYear, setCurrentAcademicYear] = useState("");
  const [currentClass, setCurrentClass] = useState("");
  const [currentSubject, setCurrentSubject] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showArchived, setShowArchived] = useState(false);

  const { classSubjects } = useGetSubjectClasses();
  const { me } = useTeacherGetMe();
  const { studentCalendars } = useGetCalendars();

  const sortedTerms = useMemo(
    () => getSortedSchoolTerms(studentCalendars ?? []),
    [studentCalendars],
  );
  const latestTermId = sortedTerms[0]?.id;

  const termSelectData = useMemo(
    () =>
      sortedTerms.map((t) => {
        const cal = studentCalendars?.find((c) =>
          c.terms?.some((term) => term.id === t.id),
        );
        const label = cal ? `${t.termName} — ${cal.name}` : t.termName;
        return { value: t.id, label };
      }),
    [sortedTerms, studentCalendars],
  );

  const showLatestInSelect = Boolean(
    latestTermId && currentTerm === latestTermId,
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
    [showLatestInSelect],
  );

  useEffect(() => {
    if (!studentCalendars?.length || sortedTerms.length === 0) return;
    setCurrentTerm((prev) => {
      if (prev && sortedTerms.some((t) => t.id === prev)) return prev;
      return sortedTerms[0].id;
    });
  }, [studentCalendars, sortedTerms]);

  useEffect(() => {
    if (!currentTerm || !studentCalendars?.length) return;
    const cal = studentCalendars.find((c) =>
      c.terms?.some((t) => t.id === currentTerm),
    );
    if (cal) setCurrentAcademicYear(cal.id);
  }, [currentTerm, studentCalendars]);

  useEffect(() => {
    if (classId) {
      const classIdStr = classId.toString();
      setCurrentClass(classIdStr);
      const matchedItem = classSubjects?.find(
        (item) => item.classLevel.id === classIdStr,
      );
      if (matchedItem?.subjects?.length) {
        setCurrentSubject(matchedItem.subjects[0].id);
      }
    }
  }, [classId, classSubjects]);

  const handleSelectChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
    type: "subject",
  ) => {
    if (type === "subject") setCurrentSubject(event.target.value);
  };

  const subjectOptions = [
    { label: "Subject", value: "" },
    ...(classSubjects
      ?.find((item) => item.classLevel.id === currentClass)
      ?.subjects.map((subject) => ({
        label: subject.name,
        value: subject.id,
      })) ?? []),
  ];

  const { studentsForGrading, isLoading, refetch } = useGetStudentsForGrading(
    classId as string,
    currentSubject,
    currentAcademicYear,
    currentTerm,
  );

  const gradingData = studentsForGrading as StudentsForGradingResponse | undefined;
  const classScoreMax =
    gradingData?.metadata?.classScoreMax ?? me?.school?.classScorePercentage ?? 30;
  const examScoreMax =
    gradingData?.metadata?.examScoreMax ?? me?.school?.examScorePercentage ?? 70;
  const gradingBands = gradingData?.metadata?.gradingBands ?? [];

  const { status: approvalStatus, isLoading: approvalStatusLoading } =
    useGetTeacherClassResultsApprovalStatus(
      classId as string | undefined,
      currentTerm || undefined,
    );

  const resultStatus =
    approvalStatus?.resultStatus ?? gradingData?.metadata?.resultStatus;

  const isGradingClosed = Boolean(
    approvalStatus?.schoolAdminApproved ||
      approvalStatus?.resultStatus === "published" ||
      ((approvalStatus?.isApproved || resultStatus === "submitted") &&
        resultStatus !== "returned" &&
        resultStatus !== "draft"),
  );
  const isGradingOpen = !isGradingClosed;

  const { mutate: postGradesMutation, isPending: isSavingGrades } =
    usePostStudentGrades();

  useEffect(() => {
    if (gradingData?.students?.length) {
      let filtered = gradingData.students;
      if (!showArchived) {
        filtered = filtered.filter((s) => !s.isArchived);
      }
      setStudentScores(
        filtered.map((s) => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          studentId: s.studentId,
          isArchived: s.isArchived,
          archivedAt: s.archivedAt,
          classScore:
            s.scores?.classScore !== null && s.scores?.classScore !== undefined
              ? Number(s.scores.classScore)
              : null,
          examScore:
            s.scores?.examScore !== null && s.scores?.examScore !== undefined
              ? Number(s.scores.examScore)
              : null,
          totalScore:
            s.scores?.totalScore !== null && s.scores?.totalScore !== undefined
              ? Number(s.scores.totalScore)
              : null,
          feedback: s.feedback ?? "",
          status: s.status ?? null,
        })),
      );
    } else {
      setStudentScores([]);
    }
  }, [gradingData, showArchived]);

  const handleScoreChange = (
    studentId: string,
    field: "classScore" | "examScore",
    value: string,
  ) => {
    const parsed = parseEditableScore(value);
    if (value.trim() !== "" && parsed === null) return;

    setStudentScores((prev) =>
      prev.map((student) => {
        if (student.id.toString() !== studentId) return student;
        const classScore = field === "classScore" ? parsed : student.classScore;
        const examScore = field === "examScore" ? parsed : student.examScore;
        const totalScore =
          classScore !== null && examScore !== null
            ? classScore + examScore
            : null;
        return { ...student, classScore, examScore, totalScore };
      }),
    );
  };

  const handleFeedbackChange = (studentId: string, feedback: string) => {
    setStudentScores((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, feedback } : student,
      ),
    );
  };

  const buildPayload = (
    saveMode: "draft" | "submit",
    forceSubmit?: boolean,
  ): PostGradesPayload => ({
    classLevelId: currentClass,
    subjectId: currentSubject,
    academicTermId: currentTerm,
    saveMode,
    forceSubmit,
    grades: studentScores
      .filter((student) => !student.isArchived)
      .map((student) => ({
        studentId: student.id,
        classScore: student.classScore,
        examScore: student.examScore,
        feedback: student.feedback.trim() || null,
      })),
  });

  const previewRows = useMemo(
    () =>
      buildGradePreviewRows(
        studentScores,
        gradingBands,
        classScoreMax,
        examScoreMax,
      ),
    [studentScores, gradingBands, classScoreMax, examScoreMax],
  );

  const previewRowMap = useMemo(() => {
    const map = new Map<string, (typeof previewRows)[number]>();
    previewRows.forEach((row) => map.set(row.studentId, row));
    return map;
  }, [previewRows]);

  const invalidCount = previewRows.filter((row) => row.isInvalid).length;
  const missingCount = previewRows.filter((row) => row.isMissing).length;

  const rowValidationMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof validateGradingRow>>();
    studentScores
      .filter((s) => !s.isArchived)
      .forEach((student) => {
        map.set(
          student.id,
          validateGradingRow(
            {
              studentId: student.id,
              classScore: student.classScore,
              examScore: student.examScore,
            },
            classScoreMax,
            examScoreMax,
          ),
        );
      });
    return map;
  }, [studentScores, classScoreMax, examScoreMax]);

  const draftStatusBadge = useMemo(() => {
    const active = studentScores.filter((s) => !s.isArchived);
    const submitted = active.filter((s) => s.status === "submitted").length;
    const draft = active.filter((s) => s.status === "draft").length;
    if (!active.length) return null;
    if (submitted === active.length) {
      return (
        <Badge variant="light" color="blue" size="sm">
          All grades saved
        </Badge>
      );
    }
    if (draft > 0) {
      return (
        <Badge variant="light" color="yellow" size="sm">
          {draft} draft{draft === 1 ? "" : "s"}
        </Badge>
      );
    }
    return null;
  }, [studentScores]);

  const onError = (error: unknown) => {
    const err = error as ErrorResponse;
    const message = err?.response?.data?.message;
    if (typeof message === "object" && message !== null && "missing" in message) {
      toast.error("Some students still have missing scores.");
      return;
    }
    toast.error(JSON.stringify(message ?? "Request failed"));
  };

  const handleSaveDraft = () => {
    if (!currentClass || !currentSubject || !currentTerm) {
      toast.error("Missing required fields");
      return;
    }
    postGradesMutation(buildPayload("draft"), {
      onSuccess: () => {
        toast.success("Results saved as draft");
        refetch();
      },
      onError,
    });
  };

  const handleConfirmSubmit = (forceSubmit = false) => {
    postGradesMutation(buildPayload("submit", forceSubmit), {
      onSuccess: () => {
        toast.success("Results submitted successfully");
        setPreviewOpen(false);
        setConfirmMissingOpen(false);
        refetch();
      },
      onError,
    });
  };

  const handlePreviewSubmit = () => {
    if (invalidCount > 0) {
      toast.error("Fix invalid scores before submitting");
      setPreviewOpen(true);
      return;
    }
    if (missingCount > 0) {
      setPreviewOpen(true);
      return;
    }
    setPreviewOpen(true);
  };

  const submissionStatusBadge = useMemo(() => {
    if (approvalStatusLoading && currentTerm) {
      return (
        <Badge variant="light" color="gray" size="sm" className="font-medium">
          Loading…
        </Badge>
      );
    }
    if (approvalStatus?.schoolAdminApproved || resultStatus === "published") {
      return (
        <Badge
          variant="light"
          color="red"
          size="sm"
          className="font-medium border border-red-200"
        >
          Published
        </Badge>
      );
    }
    if (resultStatus === "returned") {
      return (
        <Badge variant="light" color="orange" size="sm" className="font-medium">
          Returned for correction
        </Badge>
      );
    }
    if (resultStatus === "approved") {
      return (
        <Badge variant="light" color="blue" size="sm" className="font-medium">
          Approved by admin
        </Badge>
      );
    }
    if (approvalStatus?.isApproved || resultStatus === "submitted") {
      return (
        <Badge
          variant="light"
          color="yellow"
          size="sm"
          className="font-medium border border-amber-200 text-amber-900"
        >
          Class results submitted
        </Badge>
      );
    }
    return (
      <Badge
        variant="light"
        color="green"
        size="sm"
        className="font-medium border border-emerald-200 text-emerald-900"
      >
        Class results open
      </Badge>
    );
  }, [approvalStatus, approvalStatusLoading, currentTerm, resultStatus]);

  return (
    <div className="pb-8">
      <div className="mb-5 flex flex-wrap gap-3">
        <CustomSelectTag
          selectClassName="py-1.5"
          value={currentClass}
          options={[
            {
              label:
                classSubjects?.find((item) => item.classLevel.id === currentClass)
                  ?.classLevel.name ?? "Selected Class",
              value: currentClass,
            },
          ]}
          onOptionItemClick={() => {}}
        />
        <CustomSelectTag
          selectClassName="py-1.5"
          value={currentSubject}
          options={subjectOptions}
          onOptionItemClick={(e) =>
            handleSelectChange(
              e as React.ChangeEvent<HTMLSelectElement>,
              "subject",
            )
          }
        />
      </div>

      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="w-full max-w-[320px] min-w-[200px]">
            <Select
              label="Academic term"
              placeholder="Select term"
              data={termSelectData}
              value={currentTerm || null}
              onChange={(v) => setCurrentTerm(v || "")}
              searchable
              disabled={sortedTerms.length === 0}
              className="w-full"
              rightSection={termSelectRightSection}
              rightSectionWidth={showLatestInSelect ? 118 : undefined}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pb-1">
            {submissionStatusBadge}
            {draftStatusBadge}
          </div>

          <label className="flex cursor-pointer items-center gap-2 pb-1">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-zinc-600">Show archived students</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <CustomButton
            text="Save draft"
            onClick={handleSaveDraft}
            disabled={
              !isGradingOpen ||
              isSavingGrades ||
              !currentSubject ||
              !currentTerm
            }
          />
          <CustomButton
            text="Preview & submit"
            onClick={handlePreviewSubmit}
            disabled={
              !isGradingOpen ||
              isSavingGrades ||
              !currentSubject ||
              !currentTerm
            }
          />
        </div>
      </div>

      {(invalidCount > 0 || missingCount > 0) && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {invalidCount > 0 && (
            <p>{invalidCount} student(s) have invalid scores (highlighted in red).</p>
          )}
          {missingCount > 0 && (
            <p>{missingCount} student(s) have missing scores (highlighted in amber).</p>
          )}
        </div>
      )}

      <article className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed border-collapse">
            <colgroup>
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[12%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
              <col className="w-[7%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
              <col className="w-[24%]" />
            </colgroup>
            <thead>
              <tr>
                {[
                  { label: "First name", align: "left" },
                  { label: "Last name", align: "left" },
                  { label: "ID", align: "left" },
                  { label: `Class (${classScoreMax}%)`, align: "left" },
                  { label: `Exam (${examScoreMax}%)`, align: "left" },
                  { label: "Total", align: "right" },
                  { label: "Grade", align: "left" },
                  { label: "Label", align: "left" },
                  { label: "Feedback", align: "left" },
                ].map((header) => (
                  <th
                    key={header.label}
                    className={`py-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500 ${
                      header.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9}>
                    <div className="relative py-20">
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                        <HashLoader color="#AB58E7" size={40} />
                      </div>
                    </div>
                  </td>
                </tr>
              ) : !studentScores.length ? (
                <tr>
                  <td colSpan={9}>
                    <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500">
                      <p className="text-base font-medium">No students found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                studentScores.map((student) => {
                  const validation = rowValidationMap.get(student.id);
                  const rowClass = validation?.isInvalid
                    ? "bg-red-50/70"
                    : validation?.isMissing
                      ? "bg-amber-50/70"
                      : student.isArchived
                        ? "bg-zinc-50"
                        : "";
                  const inputDisabled =
                    Boolean(student.isArchived) ||
                    !isGradingOpen ||
                    (student.status === "submitted" &&
                      resultStatus !== "returned" &&
                      resultStatus !== "draft");
                  const preview = previewRowMap.get(student.id);
                  return (
                    <tr key={student.id} className={`border-b border-gray-200 ${rowClass}`}>
                      <td className="py-2.5 pr-2 text-sm text-[#252C32]">
                        <span className="block truncate">
                          {student.firstName}
                          {student.isArchived && (
                            <span className="ml-1 text-xs text-zinc-500 italic">
                              (archived)
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 pr-2 text-sm text-[#252C32]">
                        <span className="block truncate">{student.lastName}</span>
                      </td>
                      <td className="py-2.5 pr-2 text-sm text-zinc-600">
                        <span className="block truncate">{student.studentId}</span>
                      </td>
                      <td className="py-2 pr-2">
                        <TableInputField
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={classScoreMax}
                          step="any"
                          value={formatScoreForInput(student.classScore)}
                          placeholder="—"
                          disabled={inputDisabled}
                          onChange={(e) =>
                            handleScoreChange(
                              student.id,
                              "classScore",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <TableInputField
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={examScoreMax}
                          step="any"
                          value={formatScoreForInput(student.examScore)}
                          placeholder="—"
                          disabled={inputDisabled}
                          onChange={(e) =>
                            handleScoreChange(
                              student.id,
                              "examScore",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="py-2.5 pr-3 text-right text-sm tabular-nums text-[#252C32]">
                        {student.totalScore ?? "—"}
                      </td>
                      <td className="py-2.5">
                        <GradeBadge grade={preview?.grade} size="sm" />
                      </td>
                      <td className="py-2.5 text-sm text-zinc-600">
                        {preview?.gradeLabel ?? "—"}
                      </td>
                      <td className="py-2">
                        <TableInputField
                          type="text"
                          value={student.feedback}
                          disabled={inputDisabled}
                          placeholder="Optional feedback"
                          title={student.feedback || undefined}
                          onChange={(e) =>
                            handleFeedbackChange(student.id, e.target.value)
                          }
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </article>

      <Pagination
        currentPage={currentPage}
        totalPages={1}
        onPageChange={setCurrentPage}
      />

      <GradingPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        rows={previewRows}
        invalidCount={invalidCount}
        missingCount={missingCount}
        busy={isSavingGrades}
        onConfirm={() => {
          if (missingCount > 0) {
            setConfirmMissingOpen(true);
            return;
          }
          handleConfirmSubmit(false);
        }}
      />

      <Dialog
        isOpen={confirmMissingOpen}
        onClose={() => setConfirmMissingOpen(false)}
        dialogTitle="Submit with missing scores?"
        subheader={`${missingCount} student(s) still have missing class or exam scores.`}
        saveButtonText="Submit anyway"
        onSave={() => handleConfirmSubmit(true)}
        busy={isSavingGrades}
      >
        <p className="px-1 text-sm text-neutral-600">
          Missing scores will be saved as zero for those students. Confirm only if
          intentional.
        </p>
      </Dialog>
    </div>
  );
};

export default ClassGrading;

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import CustomButton from "@/components/Button";
import { Pagination } from "@/components/common/Pagination";
import TableInputField from "@/components/common/TableInputField";
import {
  useGetCalendars,
  useGetStudentsForGrading,
  useGetSubjectClasses,
  useGetTeacherClassResultsApprovalStatus,
  usePostStudentGrades,
  useTeacherGetMe,
} from "@/hooks/teacher";
import { ErrorResponse, PostGradesPayload } from "@/@types";
import { toast } from "react-toastify";
import { HashLoader } from "react-spinners";
import { Badge, Combobox, Select } from "@mantine/core";
import { getSortedSchoolTerms } from "@/utils/schoolTerms";

type StudentGrading = {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  isArchived?: boolean;
  archivedAt?: string | null;
  classScore: number | undefined;
  examScore: number | undefined;
  totalScore: number;
};

export type RawStudentScore = {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  otherName: string | null;
  isArchived?: boolean;
  archivedAt?: string | null;
  scores: {
    classScore: number;
    examScore: number;
    totalScore: number;
  };
};

/** Parses score field text; returns null if input is not a valid number (ignore update). */
function parseEditableScore(value: string): number | null {
  const t = value.trim();
  if (t === "") return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function formatScoreForInput(score: number | undefined): string {
  if (score === undefined || Number.isNaN(score)) return "";
  return String(score);
}

const ClassGrading = () => {
  const { classId } = useParams();

  const [studentScores, setStudentScores] = useState<StudentGrading[]>([]);

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
    [studentCalendars]
  );
  const latestTermId = sortedTerms[0]?.id;

  const termSelectData = useMemo(
    () =>
      sortedTerms.map((t) => {
        const cal = studentCalendars?.find((c) =>
          c.terms?.some((term) => term.id === t.id)
        );
        const label = cal ? `${t.termName} — ${cal.name}` : t.termName;
        return { value: t.id, label };
      }),
    [sortedTerms, studentCalendars]
  );

  const showLatestInSelect = Boolean(
    latestTermId && currentTerm === latestTermId
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
      c.terms?.some((t) => t.id === currentTerm)
    );
    if (cal) setCurrentAcademicYear(cal.id);
  }, [currentTerm, studentCalendars]);

  useEffect(() => {
    if (classId) {
      const classIdStr = classId.toString();
      setCurrentClass(classIdStr);

      const matchedItem = classSubjects?.find(
        (item) => item.classLevel.id === classIdStr
      );

      if (matchedItem?.subjects?.length) {
        setCurrentSubject(matchedItem.subjects[0].id);
      }
    }
  }, [classId, classSubjects]);

  const handleSelectChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
    type: "subject"
  ) => {
    const value = event.target.value;
    if (type === "subject") {
      setCurrentSubject(value);
    }
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleScoreChange = (
    studentId: string,
    field: "classScore" | "examScore",
    value: string
  ) => {
    const parsed = parseEditableScore(value);
    if (parsed === null) return;

    setStudentScores((prev) =>
      prev.map((student) => {
        if (student.id.toString() === studentId) {
          const updatedStudent = {
            ...student,
            [field]: parsed,
          };
          const classScore = updatedStudent.classScore ?? 0;
          const examScore = updatedStudent.examScore ?? 0;
          updatedStudent.totalScore =
            (Number.isFinite(classScore) ? classScore : 0) +
            (Number.isFinite(examScore) ? examScore : 0);
          return updatedStudent;
        }
        return student;
      })
    );
  };

  const { mutate: postGradesMutation, isPending: isSubmittingGrades } =
    usePostStudentGrades();

  const handleSubmitGrades = () => {
    if (!currentClass || !currentSubject || !currentTerm) {
      toast.error("Missing required fields");
      return;
    }

    const grades = studentScores
      .filter((student) => !student.isArchived)
      .map((student) => ({
        studentId: student.id,
        classScore: student.classScore || 0,
        examScore: student.examScore || 0,
      }));

    const payload: PostGradesPayload = {
      classLevelId: currentClass,
      subjectId: currentSubject,
      academicTermId: currentTerm,
      grades,
    };

    postGradesMutation(payload, {
      onSuccess: () => {
        toast.success("Grades submitted successfully");
      },
      onError: (error: unknown) => {
        toast.error(
          JSON.stringify(
            (error as ErrorResponse)?.response?.data?.message ||
            "Submission failed"
          )
        );
      },
    });
  };

  const { studentsForGrading, isLoading } = useGetStudentsForGrading(
    classId as string,
    currentSubject,
    currentAcademicYear,
    currentTerm
  );

  const { status: approvalStatus, isLoading: approvalStatusLoading } =
    useGetTeacherClassResultsApprovalStatus(
      classId as string | undefined,
      currentTerm || undefined
    );

  const isGradingClosed = Boolean(
    approvalStatus &&
    (approvalStatus.schoolAdminApproved || approvalStatus.isApproved)
  );
  const isGradingOpen = !isGradingClosed;

  const submissionStatusBadge = useMemo(() => {
    if (approvalStatusLoading && currentTerm) {
      return (
        <Badge variant="light" color="gray" size="md" className="font-medium">
          Loading…
        </Badge>
      );
    }
    if (approvalStatus?.schoolAdminApproved) {
      return (
        <Badge
          variant="light"
          color="red"
          size="md"
          className="font-medium border border-red-200"
        >
          Locked by school admin
        </Badge>
      );
    }
    if (approvalStatus?.isApproved) {
      return (
        <Badge
          variant="light"
          color="yellow"
          size="md"
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
        size="md"
        className="font-medium border border-emerald-200 text-emerald-900"
      >
        Open for submission
      </Badge>
    );
  }, [approvalStatus, approvalStatusLoading, currentTerm]);

  useEffect(() => {
    if (studentsForGrading?.students?.length) {
      let filtered = studentsForGrading.students;

      if (!showArchived) {
        filtered = filtered.filter((s: RawStudentScore) => !s.isArchived);
      }

      const normalized = filtered.map((s: RawStudentScore) => {
        const classScore = Number(s.scores?.classScore);
        const examScore = Number(s.scores?.examScore);
        const safeClass = Number.isFinite(classScore) ? classScore : 0;
        const safeExam = Number.isFinite(examScore) ? examScore : 0;
        const totalFromApi = Number(s.scores?.totalScore);
        const totalScore = Number.isFinite(totalFromApi)
          ? totalFromApi
          : safeClass + safeExam;
        return {
          ...s,
          classScore: safeClass,
          examScore: safeExam,
          totalScore,
        };
      });
      setStudentScores(normalized);
    } else {
      setStudentScores([]);
    }
  }, [studentsForGrading, showArchived]);

  return (
    <div className="pb-8">
      <div>
        <div className="flex gap-3 flex-wrap">
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
            onOptionItemClick={() => { }}
          />
          <CustomSelectTag
            selectClassName="py-1.5"
            value={currentSubject}
            options={subjectOptions}
            onOptionItemClick={(e) =>
              handleSelectChange(
                e as React.ChangeEvent<HTMLSelectElement>,
                "subject"
              )
            }
          />
        </div>

        <h3 className="my-4 font-bold">Academic Calendar</h3>
        <div className="flex justify-between items-end mb-6 flex-wrap gap-4">
          <div className="flex flex-wrap gap-4 items-end">
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
                styles={{
                  input: {
                    borderColor: "var(--mantine-color-gray-3)",
                  },
                }}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer pb-1">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">
                Show archived students
              </span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {submissionStatusBadge}
            <CustomButton
              text="Save Changes"
              onClick={handleSubmitGrades}
              disabled={
                !isGradingOpen ||
                isSubmittingGrades ||
                !currentSubject ||
                !currentTerm
              }
            />
          </div>
        </div>

        <section className="bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[150px]">
                    <div>First Name</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[200px]">
                    <div>Last Name</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[200px]">
                    <div>ID</div>
                  </th>
                  <th className="px-2 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[200px]">
                    <div>
                      Class Score({me?.school?.classScorePercentage || 30}%)
                    </div>
                  </th>
                  <th className="px-2 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[100px]">
                    <div>
                      Exams Score({me?.school?.examScorePercentage || 70}%)
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[100px]">
                    <div>Total Score(100%)</div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {(() => {
                  if (isLoading) {
                    return (
                      <tr>
                        <td colSpan={6}>
                          <div className="relative py-20 bg-white">
                            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 backdrop-blur-sm">
                              <HashLoader color="#AB58E7" size={40} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  if (!studentScores?.length) {
                    return (
                      <tr>
                        <td colSpan={6}>
                          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                            <p className="text-lg font-medium">No students found</p>
                            <p className="text-sm text-gray-400 mt-1">
                              Once students are made, they will appear in this
                              table.
                            </p>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return studentScores.map((student, index) => {
                    const isArchived = student.isArchived || false;
                    const inputDisabled = isArchived || !isGradingOpen;
                    return (
                      <tr key={index} className={isArchived ? "bg-gray-50" : ""}>
                        <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                          {student.firstName}
                          {isArchived && (
                            <span className="ml-2 text-xs text-gray-500 italic">
                              (archived)
                            </span>
                          )}
                        </td>
                        <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                          {student.lastName}
                        </td>
                        <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                          {student.studentId}
                        </td>
                        <td className="text-sm px-3 py-1 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                          <TableInputField
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="any"
                            value={formatScoreForInput(student.classScore)}
                            placeholder="Enter class score"
                            disabled={inputDisabled}
                            onChange={(e) =>
                              handleScoreChange(
                                student.id,
                                "classScore",
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td className="text-sm py-1 px-3 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                          <TableInputField
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="any"
                            value={formatScoreForInput(student.examScore)}
                            placeholder="Enter exam score"
                            disabled={inputDisabled}
                            onChange={(e) =>
                              handleScoreChange(
                                student.id,
                                "examScore",
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                          {student.totalScore}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </section>

        <Pagination
          currentPage={currentPage}
          totalPages={1}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default ClassGrading;

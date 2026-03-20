"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Select } from "@mantine/core";
import { IconEye } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { HashLoader } from "react-spinners";
import type { CurriculumProgressDashboardRow } from "@/@types";
import { CurriculumItem, User } from "@/@types";
import {
  // useGetCalendars,
  useGetClassLevels,
  useGetCurricula,
  useGetCurriculumById,
  useGetCurriculumProgressDashboard,
  useGetSchoolUsers,
  // useGetTerms,
} from "@/hooks/school-admin";

function teacherDisplayName(
  teacher: CurriculumProgressDashboardRow["teacher"]
): string {
  if (!teacher?.id) return "—";
  const n = teacher.name?.trim();
  if (n) return n;
  const fn = teacher.firstName ?? "";
  const ln = teacher.lastName ?? "";
  const combined = `${fn} ${ln}`.trim();
  return combined || "—";
}

type RowUiStatus = "completed" | "in_progress" | "todo";

function rowUiStatus(row: CurriculumProgressDashboardRow): RowUiStatus {
  if (row.status === "completed") return "completed";
  if (row.progressPercent > 0) return "in_progress";
  return "todo";
}

export const CurriculumProgressTabSection: React.FC = () => {
  const router = useRouter();
  const [curriculumId, setCurriculumId] = useState("");
  const [subjectCatalogId, setSubjectCatalogId] = useState("");
  const [classLevelId, setClassLevelId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  // const [selectedCalendarId, setSelectedCalendarId] = useState("");
  const [academicTermId, setAcademicTermId] = useState("");

  const { curricula } = useGetCurricula();
  const { curriculum, isLoading: curriculumLoading } =
    useGetCurriculumById(curriculumId);
  const { classLevels } = useGetClassLevels();
  // const { calendars } = useGetCalendars();
  // const { terms } = useGetTerms(selectedCalendarId || "");
  const { schoolUsers: schoolTeachers } = useGetSchoolUsers(
    1,
    "",
    "",
    "",
    "Teacher",
    500
  );

  useEffect(() => {
    setSubjectCatalogId("");
  }, [curriculumId]);

  useEffect(() => {
    if (!curriculumId) {
      // setSelectedCalendarId("");
      setAcademicTermId("");
      return;
    }
    const c = curriculum as CurriculumItem;
    // const calId = c?.academicTerm?.academicCalendar?.id ?? "";
    const termId = c?.academicTerm?.id ?? "";
    // setSelectedCalendarId(calId || "");
    setAcademicTermId(termId || "");
  }, [
    curriculumId,
    curriculum?.academicTerm?.id,
    // curriculum?.academicTerm?.academicCalendar?.id,
  ]);

  const curriculumOptions =
    curricula?.map((c) => ({
      value: String(c.id),
      label: String(c.name),
    })) ?? [];

  const subjectOptions = useMemo(() => {
    const fromCurriculum = (curriculum as CurriculumItem)?.subjectCatalogs ?? [];
    return [
      { value: "", label: "All Subjects" },
      ...fromCurriculum.map((s) => ({
        value: String(s.id),
        label: String(s.name),
      })),
    ];
  }, [curriculum]);

  const classLevelOptions = [
    { value: "", label: "All Class Levels" },
    ...(classLevels?.map((cl) => ({
      value: String(cl.id),
      label: String(cl.name),
    })) ?? []),
  ];

  const teacherOptions = [
    { value: "", label: "All Teachers" },
    ...(schoolTeachers?.map((t: User) => ({
      value: String(t.id),
      label: `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim() || "—",
    })) ?? []),
  ];

  // const calendarOptions =
  //   calendars?.map((cal) => ({
  //     value: String(cal.id),
  //     label: String(cal.name),
  //   })) ?? [];

  // const termOptions =
  //   terms?.map((t) => ({
  //     value: String(t.id),
  //     label: String(t.name ?? t.termName ?? ""),
  //   })) ?? [];

  const filters = useMemo(
    () => ({
      curriculumId: curriculumId || undefined,
      subjectCatalogId: subjectCatalogId || undefined,
      classLevelId: classLevelId || undefined,
      teacherId: teacherId || undefined,
      academicTermId: academicTermId || undefined,
    }),
    [curriculumId, subjectCatalogId, classLevelId, teacherId, academicTermId]
  );

  const { dashboard, isLoading } = useGetCurriculumProgressDashboard(filters);

  const rows = dashboard?.rows ?? [];
  const summary = dashboard?.summary;

  const headline = useMemo(() => {
    const total = rows.length;
    const completed = rows.filter((r) => r.status === "completed").length;
    const inProgress = rows.filter(
      (r) => r.status === "pending" && r.progressPercent > 0
    ).length;
    const avg =
      total === 0
        ? 0
        : Math.round(
            rows.reduce((acc, r) => acc + r.progressPercent, 0) / total
          );
    return { total, completed, inProgress, avgProgress: summary?.avgProgress ?? avg };
  }, [rows, summary?.avgProgress]);

  const onViewTopicDetail = (row: CurriculumProgressDashboardRow) => {
    const params = new URLSearchParams();
    params.set("subjectId", row.subjectId);
    if (academicTermId) params.set("academicTermId", academicTermId);
    const cur = curricula?.find((c) => String(c.id) === curriculumId);
    if (cur?.name) params.set("curriculumName", cur.name);
    router.push(
      `/admin/subjects/topics/${row.topicId}/detail?${params.toString()}`
    );
  };

  return (
    <div className="pb-8">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-1">Total Topics</p>
          <p className="text-2xl font-semibold text-gray-900">
            {headline.total}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-1">Completed</p>
          <p className="text-2xl font-semibold text-green-600">
            {headline.completed}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-1">In Progress</p>
          <p className="text-2xl font-semibold text-blue-600">
            {headline.inProgress}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-1">Avg. Progress</p>
          <p className="text-2xl font-semibold text-purple-600">
            {headline.avgProgress}%
          </p>
        </div>
      </section>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Curriculum"
            placeholder="Select curriculum"
            data={curriculumOptions}
            value={curriculumId || null}
            onChange={(v) => setCurriculumId((v as string) ?? "")}
            searchable
            clearable
          />
          <Select
            label="Subject"
            placeholder="All Subjects"
            data={subjectOptions}
            value={subjectCatalogId}
            onChange={(v) => setSubjectCatalogId((v as string) ?? "")}
            searchable
            disabled={!curriculumId || curriculumLoading}
          />
          <Select
            label="Class Level"
            placeholder="All Class Levels"
            data={classLevelOptions}
            value={classLevelId}
            onChange={(v) => setClassLevelId((v as string) ?? "")}
            searchable
            clearable
          />
          <Select
            label="Teacher"
            placeholder="All Teachers"
            data={teacherOptions}
            value={teacherId}
            onChange={(v) => setTeacherId((v as string) ?? "")}
            searchable
            clearable
          />
        </div>
        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Select
            label="Academic Calendar"
            placeholder="Pick calendar"
            data={calendarOptions}
            value={selectedCalendarId || null}
            onChange={(v) => {
              setSelectedCalendarId((v as string) ?? "");
              setAcademicTermId("");
            }}
            searchable
            clearable
          />
          <Select
            label="Academic Term"
            placeholder="Optional — progress uses curriculum term if empty"
            data={termOptions}
            value={academicTermId || null}
            onChange={(v) => setAcademicTermId((v as string) ?? "")}
            searchable
            clearable
            disabled={!selectedCalendarId}
          />
        </div> */}
      </div>

      <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-225">
            <thead>
              <tr className="bg-blue-50">
                {[
                  "Topic",
                  "Subject",
                  "Teacher",
                  "Start",
                  "End",
                  "Progress",
                  "Status",
                  "Completed",
                  "",
                ].map((h) => (
                  <th
                    key={h || "actions"}
                    className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-(--Gray-200,#EAECF0) min-h-11 text-left max-md:px-5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                if (isLoading) {
                  return (
                    <tr>
                      <td colSpan={9}>
                        <div className="relative py-20 bg-white">
                          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 backdrop-blur-sm">
                            <HashLoader color="#AB58E7" size={40} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                if (!rows.length) {
                  return (
                    <tr>
                      <td colSpan={9}>
                        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                          <p className="text-lg font-medium">No progress data</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Adjust filters or select a curriculum with assigned
                            subjects and topics.
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return rows.map((row) => {
                  const ui = rowUiStatus(row);
                  const statusClass =
                    ui === "completed"
                      ? "text-green-800 bg-green-100"
                      : ui === "in_progress"
                        ? "text-blue-800 bg-blue-100"
                        : "text-gray-700 bg-gray-100";
                  const statusLabel =
                    ui === "completed"
                      ? "Completed"
                      : ui === "in_progress"
                        ? "In Progress"
                        : "To Do";
                  const barColor =
                    row.progressPercent >= 100
                      ? "bg-green-500"
                      : row.progressPercent > 0
                        ? "bg-purple-500"
                        : "bg-gray-200";
                  return (
                    <tr key={`${row.subjectId}-${row.topicId}`}>
                      <td className="px-6 py-4 border-b border-solid border-b-(--Gray-200,#EAECF0) min-h-18 max-md:px-5 align-top">
                        <div className="font-semibold text-gray-900">
                          {row.topicName}
                        </div>
                        {row.topicDescription ? (
                          <div className="text-sm text-gray-500 mt-0.5">
                            {row.topicDescription}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-(--Gray-200,#EAECF0) min-h-18 max-md:px-5">
                        {row.subjectCatalog.name}
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-(--Gray-200,#EAECF0) min-h-18 max-md:px-5">
                        {teacherDisplayName(row.teacher)}
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-(--Gray-200,#EAECF0) min-h-18 max-md:px-5 whitespace-nowrap">
                        {row.plannedStartDate ?? "—"}
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-(--Gray-200,#EAECF0) min-h-18 max-md:px-5 whitespace-nowrap">
                        {row.plannedEndDate ?? "—"}
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-(--Gray-200,#EAECF0) min-h-18 max-md:px-5 min-w-35">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden min-w-18">
                            <div
                              className={`h-full rounded-full ${barColor}`}
                              style={{
                                width: `${Math.min(100, row.progressPercent)}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-700 tabular-nums shrink-0">
                            {row.progressPercent}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-(--Gray-200,#EAECF0) min-h-18 max-md:px-5">
                        <span
                          className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full ${statusClass}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-(--Gray-200,#EAECF0) min-h-18 max-md:px-5 whitespace-nowrap">
                        {row.dateCompleted ?? "—"}
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-(--Gray-200,#EAECF0) min-h-18 max-md:px-5">
                        <button
                          type="button"
                          disabled={!row.subjectId || !row.topicId}
                          onClick={() => onViewTopicDetail(row)}
                          className="p-1.5 rounded-md text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="View topic detail"
                        >
                          <IconEye size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

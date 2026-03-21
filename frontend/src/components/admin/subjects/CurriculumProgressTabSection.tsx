"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Select } from "@mantine/core";
import { IconEye } from "@tabler/icons-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HashLoader } from "react-spinners";
import type { CurriculumProgressDashboardRow } from "@/@types";
import { User } from "@/@types";
import {
  useGetAllSubjects,
  useGetCalendars,
  useGetClassLevels,
  useGetCurricula,
  useGetCurriculumProgressDashboard,
  useGetSchoolUsers,
  useGetTerms,
} from "@/hooks/school-admin";

const CP = {
  curriculum: "cpCurriculum",
  subject: "cpSubject",
  classLevel: "cpClass",
  teacher: "cpTeacher",
  cal: "cpCal",
  term: "cpTerm",
} as const;

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
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [curriculumId, setCurriculumId] = useState(
    () => searchParams.get(CP.curriculum) ?? ""
  );
  const [subjectCatalogId, setSubjectCatalogId] = useState(
    () => searchParams.get(CP.subject) ?? ""
  );
  const [classLevelId, setClassLevelId] = useState(
    () => searchParams.get(CP.classLevel) ?? ""
  );
  const [teacherId, setTeacherId] = useState(
    () => searchParams.get(CP.teacher) ?? ""
  );
  const [selectedCalendarId, setSelectedCalendarId] = useState(
    () => searchParams.get(CP.cal) ?? ""
  );
  const [academicTermId, setAcademicTermId] = useState(
    () => searchParams.get(CP.term) ?? ""
  );

  const { curricula } = useGetCurricula();
  const { subjects: allSubjectCatalogs, isLoading: subjectCatalogsLoading } =
    useGetAllSubjects();
  const { classLevels } = useGetClassLevels();
  const { calendars } = useGetCalendars();
  const { terms } = useGetTerms(selectedCalendarId || "");
  const { schoolUsers: schoolTeachers } = useGetSchoolUsers(
    1,
    "",
    "",
    "",
    "Teacher",
    500
  );

  useEffect(() => {
    setCurriculumId(searchParams.get(CP.curriculum) ?? "");
    setSubjectCatalogId(searchParams.get(CP.subject) ?? "");
    setClassLevelId(searchParams.get(CP.classLevel) ?? "");
    setTeacherId(searchParams.get(CP.teacher) ?? "");
    setSelectedCalendarId(searchParams.get(CP.cal) ?? "");
    setAcademicTermId(searchParams.get(CP.term) ?? "");
  }, [searchParams]);

  const replaceProgressUrl = useCallback(
    (next: {
      curriculumId: string;
      subjectCatalogId: string;
      classLevelId: string;
      teacherId: string;
      selectedCalendarId: string;
      academicTermId: string;
    }) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set("tab", "curriculum-progress");
      const setOrDel = (key: string, val: string) => {
        if (val) p.set(key, val);
        else p.delete(key);
      };
      setOrDel(CP.curriculum, next.curriculumId);
      setOrDel(CP.subject, next.subjectCatalogId);
      setOrDel(CP.classLevel, next.classLevelId);
      setOrDel(CP.teacher, next.teacherId);
      setOrDel(CP.cal, next.selectedCalendarId);
      setOrDel(CP.term, next.academicTermId);
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (!selectedCalendarId && calendars?.length) {
      const firstId = String(calendars[0].id);
      setSelectedCalendarId(firstId);
      replaceProgressUrl({
        curriculumId,
        subjectCatalogId,
        classLevelId,
        teacherId,
        selectedCalendarId: firstId,
        academicTermId,
      });
    }
  }, [
    calendars,
    selectedCalendarId,
    curriculumId,
    subjectCatalogId,
    classLevelId,
    teacherId,
    academicTermId,
    replaceProgressUrl,
  ]);

  useEffect(() => {
    if (!selectedCalendarId || !terms?.length) return;
    const validIds = new Set(terms.map((t) => String(t.id)));
    const next =
      academicTermId && validIds.has(academicTermId)
        ? academicTermId
        : String(terms[0].id);
    if (next === academicTermId) return;
    setAcademicTermId(next);
    replaceProgressUrl({
      curriculumId,
      subjectCatalogId,
      classLevelId,
      teacherId,
      selectedCalendarId,
      academicTermId: next,
    });
  }, [
    terms,
    selectedCalendarId,
    academicTermId,
    curriculumId,
    subjectCatalogId,
    classLevelId,
    teacherId,
    replaceProgressUrl,
  ]);

  const curriculumOptions =
    curricula?.map((c) => ({
      value: String(c.id),
      label: String(c.name),
    })) ?? [];

  const subjectOptions = useMemo(() => {
    const list = allSubjectCatalogs ?? [];
    return [
      { value: "", label: "All Subjects" },
      ...list.map((s) => ({
        value: String(s.id),
        label: String(s.name),
      })),
    ];
  }, [allSubjectCatalogs]);

  useEffect(() => {
    if (subjectCatalogsLoading || !subjectCatalogId || !allSubjectCatalogs?.length)
      return;
    const ok = allSubjectCatalogs.some(
      (s) => String(s.id) === subjectCatalogId
    );
    if (!ok) {
      setSubjectCatalogId("");
      replaceProgressUrl({
        curriculumId,
        subjectCatalogId: "",
        classLevelId,
        teacherId,
        selectedCalendarId,
        academicTermId,
      });
    }
  }, [
    subjectCatalogsLoading,
    allSubjectCatalogs,
    subjectCatalogId,
    curriculumId,
    classLevelId,
    teacherId,
    selectedCalendarId,
    academicTermId,
    replaceProgressUrl,
  ]);

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

  const calendarOptions =
    calendars?.map((cal) => ({
      value: String(cal.id),
      label: String(cal.name),
    })) ?? [];

  const termOptions =
    terms?.map((t) => ({
      value: String(t.id),
      label: String(t.name ?? t.termName ?? ""),
    })) ?? [];

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

  const buildProgressListUrl = () => {
    const p = new URLSearchParams();
    p.set("tab", "curriculum-progress");
    if (curriculumId) p.set(CP.curriculum, curriculumId);
    if (subjectCatalogId) p.set(CP.subject, subjectCatalogId);
    if (classLevelId) p.set(CP.classLevel, classLevelId);
    if (teacherId) p.set(CP.teacher, teacherId);
    if (selectedCalendarId) p.set(CP.cal, selectedCalendarId);
    if (academicTermId) p.set(CP.term, academicTermId);
    return `${pathname}?${p.toString()}`;
  };

  const onViewTopicDetail = (row: CurriculumProgressDashboardRow) => {
    const params = new URLSearchParams();
    params.set("subjectId", row.subjectId);
    if (academicTermId) params.set("academicTermId", academicTermId);
    const cur = curricula?.find((c) => String(c.id) === curriculumId);
    if (cur?.name) params.set("curriculumName", cur.name);
    params.set("returnPath", buildProgressListUrl());
    router.push(
      `/admin/subjects/topics/${row.topicId}/detail?${params.toString()}`
    );
  };

  const patch = (partial: Partial<{
    curriculumId: string;
    subjectCatalogId: string;
    classLevelId: string;
    teacherId: string;
    selectedCalendarId: string;
    academicTermId: string;
  }>) => {
    const next = {
      curriculumId,
      subjectCatalogId,
      classLevelId,
      teacherId,
      selectedCalendarId,
      academicTermId,
      ...partial,
    };
    if (partial.curriculumId !== undefined) setCurriculumId(partial.curriculumId);
    if (partial.subjectCatalogId !== undefined)
      setSubjectCatalogId(partial.subjectCatalogId);
    if (partial.classLevelId !== undefined) setClassLevelId(partial.classLevelId);
    if (partial.teacherId !== undefined) setTeacherId(partial.teacherId);
    if (partial.selectedCalendarId !== undefined)
      setSelectedCalendarId(partial.selectedCalendarId);
    if (partial.academicTermId !== undefined)
      setAcademicTermId(partial.academicTermId);
    replaceProgressUrl(next);
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
            onChange={(v) => patch({ curriculumId: (v as string) ?? "" })}
            searchable
            clearable
          />
          <Select
            label="Subject"
            placeholder="All Subjects"
            data={subjectOptions}
            value={subjectCatalogId}
            onChange={(v) =>
              patch({ subjectCatalogId: (v as string) ?? "" })
            }
            searchable
            disabled={subjectCatalogsLoading}
          />
          <Select
            label="Class Level"
            placeholder="All Class Levels"
            data={classLevelOptions}
            value={classLevelId}
            onChange={(v) => patch({ classLevelId: (v as string) ?? "" })}
            searchable
            clearable
          />
          <Select
            label="Teacher"
            placeholder="All Teachers"
            data={teacherOptions}
            value={teacherId}
            onChange={(v) => patch({ teacherId: (v as string) ?? "" })}
            searchable
            clearable
          />
          <Select
            label="Academic Calendar"
            placeholder="Pick calendar"
            data={calendarOptions}
            value={selectedCalendarId || null}
            onChange={(v) => {
              const next = (v as string) ?? "";
              patch({
                selectedCalendarId: next,
                academicTermId: "",
              });
            }}
            searchable
          />
          <Select
            label="Academic Term"
            placeholder="Optional — progress uses curriculum term if empty"
            data={termOptions}
            value={academicTermId || null}
            onChange={(v) =>
              patch({ academicTermId: (v as string) ?? "" })
            }
            searchable
            clearable
            disabled={!selectedCalendarId}
          />
        </div>
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
                  "Start Date",
                  "End Date",
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
                        : "text-[#cd3500] bg-[#ffedd4]";
                  const statusLabel =
                    ui === "completed"
                      ? "Completed"
                      : ui === "in_progress"
                        ? "In Progress"
                        : "Pending";
                  const barColor =
                    row.progressPercent >= 100
                      ? "bg-green-500"
                      : row.progressPercent > 0
                        ? "bg-purple-500"
                        : "bg-gray-200";
                  const rowClickable = Boolean(row.subjectId && row.topicId);
                  return (
                    <tr
                      key={`${row.subjectId}-${row.topicId}`}
                      onClick={() => {
                        if (!rowClickable) return;
                        onViewTopicDetail(row);
                      }}
                      tabIndex={rowClickable ? 0 : -1}
                      aria-disabled={!rowClickable}
                      className={
                        rowClickable
                          ? "cursor-pointer hover:bg-purple-50/60 focus-visible:outline-purple-400 transition-colors"
                          : "opacity-60 cursor-not-allowed"
                      }
                    >
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
                      <td className="px-2 py-4 border-b border-solid border-b-(--Gray-200,#EAECF0) min-h-18 max-md:px-2">
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
                        <span
                          className="inline-flex p-1.5 rounded-md text-purple-700 pointer-events-none"
                          aria-hidden
                        >
                          <IconEye size={20} />
                        </span>
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

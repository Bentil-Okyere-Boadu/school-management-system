"use client";

import React, { useEffect, useState } from "react";
import { CustomSelectTag } from "../../common/CustomSelectTag";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
import { GradingLegendPanel } from "@/components/common/GradingLegendPanel";
import { ResultsSubjectsTable } from "@/components/common/ResultsSubjectsTable";
import {
  averagePercentage,
  overallPerformanceBand,
  performanceBandClass,
} from "@/utils/gradeDisplay";
import CustomButton from "@/components/Button";
import { Calendar, ErrorResponse, StudentResultsResponse } from "@/@types";
import { Textarea } from "@mantine/core";
import { useSubmitStudentTermRemarks } from "@/hooks/teacher";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";

interface StudentResultProps {
  calendars: Calendar[];
  studentResults: StudentResultsResponse;
  studentId: string;
  schoolId: string;
  onCalendarChange?: (calendarId: string) => void;
  onTermChange?: (termId: string) => void;
}

const StudentResults: React.FC<StudentResultProps> = ({
  calendars,
  studentResults,
  studentId,
  onCalendarChange,
  onTermChange,
}) => {
  const [selectedAcademicCalendar, setSelectedAcademicCalendar] = useState("");
  const [calendarOptions, setCalendarOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedTermId, setSelectedTermId] = useState("");
  const [termOptions, setTermOptions] = useState<{ value: string; label: string }[]>([]);
  const [termRemarks, setTermRemarks] = useState("");

  const queryClient = useQueryClient();

  // Populate calendar dropdown options
  useEffect(() => {
    const options = calendars?.map((calendar) => ({
      value: calendar.id,
      label: calendar.name,
    }));
    setCalendarOptions(options);

    if (calendars?.length > 0) {
      const defaultCalendar = calendars[0];
      setSelectedAcademicCalendar(defaultCalendar.id);
      onCalendarChange?.(defaultCalendar.id);

      const defaultTerm = defaultCalendar.terms?.[0];
      if (defaultTerm) {
        setSelectedTermId(defaultTerm.id);
        onTermChange?.(defaultTerm.id);
        setTermOptions(
          defaultCalendar.terms.map((term) => ({
            value: term.id,
            label: term.termName,
          }))
        );
      }

    }
  }, [calendars]);

  useEffect(() => {
    setTermRemarks(studentResults.teacherRemarks);
  }, [studentResults]);

  const handleAcademicCalendarChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const calendarId = e.target.value;
    setSelectedAcademicCalendar(calendarId);
    onCalendarChange?.(calendarId);

    const selected = calendars.find((c) => c.id === calendarId);
    if (selected?.terms?.length) {
      const firstTerm = selected.terms[0];
      setSelectedTermId(firstTerm.id);
      onTermChange?.(firstTerm.id);

      setTermOptions(
        selected.terms.map((term) => ({
          value: term.id,
          label: term.termName,
        }))
      );
    } else {
      setSelectedTermId("");
      setTermOptions([]);
      onTermChange?.("");
    }
  };

  const handleTermChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const termId = e.target.value;
    setSelectedTermId(termId);
    onTermChange?.(termId);
  };



  const handleRemarksChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTermRemarks(event.target.value);
  };

  const { mutate: updateRemarks } = useSubmitStudentTermRemarks(studentId, selectedTermId);

  const onSaveChanges = () => {
    updateRemarks(termRemarks, {
      onSuccess: () => {
        toast.success('Remark submitted successfully');
        queryClient.invalidateQueries({ queryKey: ['studentTermResults'] });
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      }
    });
  };

  return (
    <div className="pb-8">
      <h1 className="text-md font-semibold text-neutral-800 mb-4">Academic Report</h1>

      <div className="flex justify-between items-end mb-6">
        <div className="flex gap-3 flex-wrap">
          {calendars?.length > 0 && (
            <CustomSelectTag
              selectClassName="py-2"
              options={calendarOptions}
              value={selectedAcademicCalendar}
              onOptionItemClick={handleAcademicCalendarChange}
            />
          )}
          {termOptions?.length > 0 && (
            <CustomSelectTag
              selectClassName="py-2"
              options={termOptions}
              value={selectedTermId}
              onOptionItemClick={handleTermChange}
            />
          )}
        </div>
        <CustomButton text="Save Changes" onClick={onSaveChanges} />
      </div>

      <div>
        {studentResults?.subjects?.length > 0 ? (
          <article className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-sm font-semibold text-zinc-600">
                {studentResults?.studentInfo?.academicYear} —{" "}
                {studentResults?.studentInfo?.term}
              </p>
              {(() => {
                const avg = averagePercentage(
                  studentResults.subjects.map((s) => s.percentage),
                );
                const band = overallPerformanceBand(avg);
                if (!band || avg == null) return null;
                return (
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${performanceBandClass(band)}`}
                    >
                      {band}
                    </span>
                    <span className="text-sm font-medium text-zinc-600">
                      {avg}% avg
                    </span>
                  </div>
                );
              })()}
            </div>

            <ResultsSubjectsTable
              subjects={studentResults.subjects}
              columns={[
                "subject",
                "classScore",
                "examScore",
                "percentage",
                "grade",
                "label",
                "feedback",
              ]}
            />

            <GradingLegendPanel
              bands={studentResults.gradingLegend}
              passMark={studentResults.passMark}
            />

            <div className="mt-6">
              <Textarea
                label="Teacher's Remark"
                placeholder="Enter brief remarks"
                value={termRemarks}
                onChange={handleRemarksChange}
                autosize
                minRows={5}
                maxRows={8}
              />
            </div>
          </article>
        ) : (
          <NoAvailableEmptyState message="No results available yet." />
        )}
      </div>
    </div>
  );
};

export default StudentResults;

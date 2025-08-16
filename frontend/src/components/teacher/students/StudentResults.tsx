"use client";

import React, { useEffect, useState } from "react";
import { CustomSelectTag } from "../../common/CustomSelectTag";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
import CustomButton from "@/components/Button";
import { Calendar, ErrorResponse, NotificationType, StudentResultsResponse } from "@/@types";
import { Textarea } from "@mantine/core";
import { useSubmitStudentTermRemarks } from "@/hooks/teacher";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateNotification } from "@/hooks/school-admin";

interface StudentResultProps {
  calendars: Calendar[];
  studentResults: StudentResultsResponse;
  studentId: string;
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
  const {mutate: createNotification} = useCreateNotification();

  const createNotificationForAdmission = () => {
      createNotification({
        title: "Student Results Updated",
        message: `Results for student with ID:${studentId} have been updated.`,
        type: NotificationType.Results,
        schoolId: 'id' as string,
      }, {
        onError: (error: unknown) => {
          console.error("Failed to create notification:", error);
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      });
    }


  const onSaveChanges = () => {
    updateRemarks(termRemarks, {
      onSuccess: () => {
        toast.success('Remark submitted successfully');
        createNotificationForAdmission();
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
          <div>
            <p className="text-sm font-semibold text-[#878787] my-5">
              {studentResults?.studentInfo?.academicYear} — {studentResults?.studentInfo?.term}
            </p>
            <table className="w-full border-collapse mb-6">
              <thead>
                <tr>
                  <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal">Subject</th>
                  <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal">Class Score</th>
                  <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal">Exam Score</th>
                  <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal">Percentage</th>
                  {/* <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal">Percentile</th>
                  <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal">Rank</th> */}
                  <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal">Grade</th>
                </tr>
              </thead>
              <tbody>
                {studentResults.subjects.map((data, i) => (
                  <tr key={i} className="border-b border-solid border-b-gray-200">
                    <td className="py-2 pl-2.5 text-sm text-[#252C32]">{data.subject}</td>
                    <td className="py-2 pl-2.5 text-sm text-[#252C32]">{data.classScore}</td>
                    <td className="py-2 pl-2.5 text-sm text-[#252C32]">{data.examScore}</td>
                    <td className="py-2 pl-2.5 text-sm text-[#252C32]">{data.percentage}</td>
                    {/* <td className="py-2 pl-2.5 text-sm text-[#252C32]">{data.percentile}</td>
                    <td className="py-2 pl-2.5 text-sm text-[#252C32]">{data.rank}</td> */}
                    <td className="py-2 pl-2.5 text-sm text-[#252C32]">{data.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>

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
          </div>
        ) : (
          <NoAvailableEmptyState message="No results available yet." />
        )}
      </div>
    </div>
  );
};

export default StudentResults;

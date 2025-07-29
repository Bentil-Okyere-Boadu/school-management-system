"use client";

import React, { useEffect, useState } from "react";
import { CustomSelectTag } from "../../common/CustomSelectTag";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
import { Calendar, StudentResultsResponse } from "@/@types";
import CustomButton from "@/components/Button";
import { IconDownload } from "@tabler/icons-react";

interface StudentResultProps {
  calendars: Calendar[];
  studentResults: StudentResultsResponse;
  showExportButton?: boolean;
  onExportButtonClick?: (item: StudentResultsResponse) => void;
  onCalendarChange?: (calendarId: string) => void;
}

const StudentResults: React.FC<StudentResultProps>  = ({calendars, showExportButton, studentResults, onExportButtonClick, onCalendarChange }) => {
    const [selectedAcademicCalendar, setSelectedAcademicCalendar] = useState('')
    const [calendarOptions, setCalendarOptions] = useState<{ value: string; label: string }[]>([]);

    useEffect(() => {
      const options = calendars?.map((calendar) => ({
          value: calendar.id,
          label: calendar.name,
      }));

      setCalendarOptions(options);

      if (calendars?.length > 0) {
          setSelectedAcademicCalendar(calendars[0].id);
          onCalendarChange?.(calendars[0].id);
      }
        
    }, [calendars]);

    const handleAcademicCalendarChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedValue = event.target.value;
      setSelectedAcademicCalendar(selectedValue)
      onCalendarChange?.(selectedValue);
    };


  return (
    <div className="pb-8">
      <h1 className="text-md font-semibold text-neutral-800 mb-4">Academic Report</h1>
      {showExportButton &&(
        <div className="flex justify-end">
          <CustomButton
            text="Export Report"
            icon={<IconDownload size={16} />}
            onClick={() => {
              onExportButtonClick?.(studentResults);
            }}
          />
        </div>
      )}

      {calendars?.length > 0 && (
        <CustomSelectTag
          options={calendarOptions}
          value={selectedAcademicCalendar}
          onOptionItemClick={handleAcademicCalendarChange}
        />
      )}

      <div>
        {studentResults?.terms?.length > 0 ? (
          <div>
            <p className="text-sm font-semibold text-[#878787] my-5">
              {studentResults?.studentInfo?.academicYear}
            </p>

            {studentResults.terms.map((term, index) => (
              <div key={index} className="mb-10">
                <h1 className="text-md font-semibold text-neutral-800 my-2">
                  {term.termName || `Term ${index + 1}`}
                </h1>

                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal">Subject</th>
                      <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal">Class Score</th>
                      <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal">Exam Score</th>
                      <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal">Percentage Score</th>
                      <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {term.subjects?.length > 0 ? (
                      term.subjects.map((data, i) => (
                        <tr key={i} className="border-b border-solid border-b-gray-200">
                          <td className="py-2 pl-2.5 text-sm text-left text-[#252C32]">{data.subject}</td>
                          <td className="py-2 pl-2.5 text-sm text-left text-[#252C32]">{data.classScore}</td>
                          <td className="py-2 pl-2.5 text-sm text-left text-[#252C32]">{data.examScore}</td>
                          <td className="py-2 pl-2.5 text-sm text-left text-[#252C32]">{data.percentage}</td>
                          <td className="py-2 pl-2.5 text-sm text-left text-[#252C32]">{data.grade}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                          <NoAvailableEmptyState message="No subjects available for this term." />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div>
                  <p className="text-xs text-[#878787] mt-4 mb-1">Teacher&apos;s Remark</p>
                  <p className="text-sm pl-1">{term.teacherRemarks}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <NoAvailableEmptyState message="No results available yet." />
        )}
      </div>
    </div>
  );
}

export default StudentResults
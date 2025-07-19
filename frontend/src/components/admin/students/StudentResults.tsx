"use client";

import React, { useEffect, useState } from "react";
import { CustomSelectTag } from "../../common/CustomSelectTag";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
import { Calendar } from "@/@types";
import CustomButton from "@/components/Button";

interface StudentResultProps {
  calendars: Calendar[];
  showExportButton?: boolean;
  onExportButtonClick?: (item: Calendar) => void;
}

const StudentResults: React.FC<StudentResultProps>  = ({calendars, showExportButton, onExportButtonClick}) => {
    const [selectedAcademicCalendar, setSelectedAcademicCalendar] = useState('')
    const [calendarOptions, setCalendarOptions] = useState<{ value: string; label: string }[]>([]);
    const [selectedCalendarData, setSelectedCalendarData] = useState<typeof calendars[0] | null>(null);


    useEffect(() => {
      const options = calendars?.map((calendar) => ({
          value: calendar.id,
          label: calendar.name,
      }));

      setCalendarOptions(options);

      if (calendars.length > 0) {
          setSelectedAcademicCalendar(calendars[0].id);
          setSelectedCalendarData(calendars[0]);
      }
        
    }, [calendars]);

    const handleAcademicCalendarChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedValue = event.target.value;
      setSelectedAcademicCalendar(selectedValue)
      const calendar = calendars.find(c => c.id === selectedValue);
      if (calendar) {
          setSelectedCalendarData(calendar);
      }
    };


  return (
    <div className="pb-8">
      <h1 className="text-md font-semibold text-neutral-800 mb-4">Academic Report</h1>
      {showExportButton &&(
        <div className="flex justify-end">
          <CustomButton
            text="Export Report"
            onClick={() => {
              if (selectedCalendarData) onExportButtonClick?.(selectedCalendarData);
            }}
          />
        </div>
      )}

      {calendars?.length > 0 && <CustomSelectTag options={calendarOptions} value={selectedAcademicCalendar} onOptionItemClick={handleAcademicCalendarChange} />}
      <div>
        { calendars?.length > 0  && (
        <div>
          <p className="text-sm font-semibold text-[#878787] my-5">{selectedCalendarData?.name}</p>
          {
            selectedCalendarData?.terms?.map((term, index) => (
              <div key={index} className="mb-10">
                <h1 className="text-md font-semibold text-neutral-800 my-2">Term {index + 1}</h1>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="">
                      <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
                        Subject
                      </th>
                      <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
                        Class Score
                      </th>
                      <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
                        Exam Score
                      </th>
                      <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
                        Percentage Score
                      </th>
                      <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      Array.isArray(term?.entries) && term.entries.length > 0 && term.entries.map((data, index) => (
                        <tr className="border-b border-solid border-b-gray-200" key={index + "12"}>
                          <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
                            {data.subject}
                          </td>
                          <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
                            {data.classScore}
                          </td>
                          <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
                            {data.examScore}
                          </td>
                          <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
                            {data.percentageScore}
                          </td>
                          <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
                            {data.grade}
                          </td>
                        </tr>
                      )) 
                    }
                  </tbody>
                </table>
                <div>
                  <p className="text-xs text-[#878787] mt-4 mb-1">Teacher&apos;s Remark</p>
                  <p className="text-sm pl-1">{term?.remarks}</p>
                </div>
              </div>
            ))
          }

          {selectedCalendarData?.terms?.length === 0 && (
            <NoAvailableEmptyState message="No terms available yet." />
          )}
        </div>
        )}
        { calendars?.length === 0 && (
          <NoAvailableEmptyState message="No academic calendar available yet." />
        )}
      </div>
    </div>
  );
}

export default StudentResults
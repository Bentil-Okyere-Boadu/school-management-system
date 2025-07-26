"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CustomSelectTag } from "../../common/CustomSelectTag";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
import CustomButton from "@/components/Button";
import { Textarea } from "@mantine/core";

const StudentResults: React.FC = () => {
  const [selectedAcademicCalendar, setSelectedAcademicCalendar] = useState("");
  const [calendarOptions, setCalendarOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedCalendarData, setSelectedCalendarData] = useState<typeof calendars[0] | null>(null);
  const [selectedTermId, setSelectedTermId] = useState("");
  const [termRemarks, setTermRemarks] = useState("");

  const calendars = useMemo(() => [
    {
      id: "fe5f4449-acdf-4c0d-ba39-1cf50b1f24d6",
      name: "2022/2023 Color Calendar1",
      terms: [
        {
          id: "1eef4266-4ccd-4914-8e95-2d040e95e304",
          termName: "Second Term",
          remarks: "Feyre has shown great improvement this term. With continued effort, even greater achievements await!",
          entries: [
            { id: "41908827", name: "hope", subject: "Mathematics", classScore: "18", examScore: "65", percentile: "2nd", percentageScore: "83", grade: "A" },
            { id: "64649300", name: "joke", subject: "English", classScore: "20", examScore: "45", percentile: "2nd", percentageScore: "65", grade: "B" }
          ]
        },
        {
          id: "4e9349cc-4940-4535-85f8-691254b02533",
          termName: "Third Term",
          remarks: "Good performance",
          entries: [
            { id: "141908827", name: "hope", subject: "Mathematics", classScore: "18", examScore: "65", percentile: "2nd", percentageScore: "83", grade: "A" },
            { id: "164649300", name: "joke", subject: "English", classScore: "20", examScore: "45", percentile: "2nd", percentageScore: "65", grade: "B" }
          ]
        }
      ]
    },
    {
      id: "5b36e7e5-0414-4e63-8928-48ed0860206b",
      name: "2023/2024 New Calendar",
      terms: [
        {
          id: "5e09f278-d7f9-4063-8ead-e68a3c1983c0",
          termName: "First Term",
          remarks: "Good performance",
          entries: [
            { id: "141908827", name: "hope", subject: "Mathematics", classScore: "18", examScore: "65", percentile: "2nd", percentageScore: "83", grade: "A" },
            { id: "164649300", name: "joke", subject: "English", classScore: "20", examScore: "45", percentile: "2nd", percentageScore: "65", grade: "B" }
          ]
        }
      ]
    }
  ], []);

  // populate calendar options and select first by default
  useEffect(() => {
    const options = calendars.map(c => ({ value: c.id, label: c.name }));
    setCalendarOptions(options);
    if (calendars.length > 0) {
      const firstCalendar = calendars[0];
      setSelectedAcademicCalendar(firstCalendar.id);
      setSelectedCalendarData(firstCalendar);
      if (firstCalendar.terms.length > 0) {
        setSelectedTermId(firstCalendar.terms[0].id);
      }
    }
  }, [calendars]);

  const handleAcademicCalendarChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const calendarId = e.target.value;
    setSelectedAcademicCalendar(calendarId);
    const calendar = calendars.find(c => c.id === calendarId);
    if (calendar) {
      setSelectedCalendarData(calendar);
      // reset selected term
      if (calendar.terms.length > 0) {
        setSelectedTermId(calendar.terms[0].id);
      } else {
        setSelectedTermId("");
      }
    }
  };

  const handleTermChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTermId(e.target.value);
  };
  
  const selectedTermData = selectedCalendarData?.terms.find(term => term.id === selectedTermId);

  const termOptions = selectedCalendarData?.terms.map(term => ({
    label: term.termName,
    value: term.id
  })) || [];

  useEffect(() => {
    if (selectedTermData) {
      setTermRemarks(selectedTermData.remarks || "");
    }
  }, [selectedTermData]);

  const handleRemarksChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTermRemarks(event.target.value);
  };

  const onSaveChanges = () => {
    console.log("Saving changes...", selectedCalendarData, selectedTermData, termRemarks);
  };


  return (
    <div className="pb-8">
      <h3 className="my-4 font-bold">Academic Calendar</h3>

      <div className="flex justify-between items-end mb-6">
        <div className="flex gap-3 flex-wrap">
          <CustomSelectTag
            options={calendarOptions}
            value={selectedAcademicCalendar}
            onOptionItemClick={handleAcademicCalendarChange}
          />
          <CustomSelectTag
            options={[{ label: "Select Term", value: "" }, ...termOptions]}
            value={selectedTermId}
            onOptionItemClick={handleTermChange}
            selectClassName="py-1.5"
          />
        </div>
        <CustomButton text="Save Changes" onClick={onSaveChanges} />
      </div>

      <div>
        {selectedCalendarData ? (
          <>
            <p className="text-sm font-semibold text-[#878787] my-5">{selectedCalendarData.name}</p>

            {selectedTermData ? (
              <div className="mb-10">
                <h1 className="text-md font-semibold text-neutral-800 my-2">{selectedTermData.termName}</h1>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal">Subject</th>
                      <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal">Class Score</th>
                      <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal">Exam Score</th>
                      <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal">Percentile</th>
                      <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal">Percentage Score</th>
                      <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTermData.entries.map(entry => (
                      <tr key={entry.id} className="border-b border-solid border-b-gray-200">
                        <td className="py-2 pl-2.5 text-sm text-[#252C32]">{entry.subject}</td>
                        <td className="py-2 pl-2.5 text-sm text-[#252C32]">{entry.classScore}</td>
                        <td className="py-2 pl-2.5 text-sm text-[#252C32]">{entry.examScore}</td>
                        <td className="py-2 pl-2.5 text-sm text-[#252C32]">{entry.percentile}</td>
                        <td className="py-2 pl-2.5 text-sm text-[#252C32]">{entry.percentageScore}</td>
                        <td className="py-2 pl-2.5 text-sm text-[#252C32]">{entry.grade}</td>
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
              <NoAvailableEmptyState message="No term selected or no entries available." />
            )}
          </>
        ) : (
          <NoAvailableEmptyState message="No academic calendar available yet." />
        )}
      </div>
    </div>
  );
};

export default StudentResults;

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
import { Calendar, School, Student, StudentResultsResponse } from "@/@types";
import CustomButton from "@/components/Button";
import { IconDownload } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}

interface StudentResultProps {
  calendars: Calendar[];
  studentResults: StudentResultsResponse;
  showExportButton?: boolean;
  onCalendarChange?: (calendarId: string) => void;
  studentData: Student
}

const StudentResults: React.FC<StudentResultProps> = ({
  calendars,
  showExportButton,
  studentResults,
  onCalendarChange,
  studentData
}) => {
  const [selectedAcademicCalendar, setSelectedAcademicCalendar] = useState("");
  const [calendarOptions, setCalendarOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [studentSchool, setStudentSchool] = useState<School | null>(null);

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

  useEffect(() => {
    setStudentSchool(studentData?.school);
  }, [studentData])

  const handleAcademicCalendarChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedValue = event.target.value;
    setSelectedAcademicCalendar(selectedValue);
    onCalendarChange?.(selectedValue);
  };

  async function getBase64FromUrl(imageUrl: string | null): Promise<string | null> {
    if (!imageUrl?.trim()) {
      return null;
    }

    try {
      const response = await fetch(imageUrl, { mode: "cors" });
      if (!response.ok) {
        console.warn(`Failed to fetch image: ${response.status} ${response.statusText}`);
        return null;
      }
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn("Error fetching or converting image:", error);
      return null;
    }
  }


  const handleExportPDF = async () => {
    const doc = new jsPDF();
    let yPos = 10;

    const logoBase64 = await getBase64FromUrl(studentSchool?.logoUrl ?? null);
    if (logoBase64) {
      // Add the image if available
      doc.addImage(logoBase64, "PNG", 14, yPos, 20, 20);
    } else {
      // Draw a grey rectangle backaground instead
      doc.setFillColor(200, 200, 200);
      doc.rect(14, yPos, 20, 20, "F");
    }

    // School name next to the logo
    doc.setFontSize(16);
    doc.text(studentSchool?.name ?? "", 40, yPos + 5);
    doc.setFontSize(10);
    doc.text(`Email: ${studentSchool?.email ?? ""}`, 40, yPos + 12);
    doc.text(`Address: ${studentSchool?.address ?? ""}`, 40, yPos + 18);
    yPos += 36;

    doc.setFontSize(14);
    doc.text("Academic Report", 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.text(`Academic Year: ${studentResults?.studentInfo?.academicYear || ""}`, 14, yPos);
    yPos += 6;

    if (studentResults?.terms?.length > 0) {
      studentResults.terms.forEach((term, idx) => {
        yPos += 8; 
        doc.setFontSize(12);
        doc.text(term.termName || `Term ${idx + 1}`, 14, yPos);
        yPos += 4;

        const tableData =
          term.subjects?.length > 0
            ? term.subjects.map((subj) => [
                subj.subject,
                subj.classScore,
                subj.examScore,
                subj.percentage,
                subj.grade,
              ])
            : [["", "", "No data available", "", ""]];

        autoTable(doc, {
          head: [["Subject", "Class Score", "Exam Score", "Percentage Score", "Grade"]],
          headStyles: { fillColor: [229, 229, 229], textColor: [0, 0, 0], fontStyle: 'bold' },
          body: tableData,
          startY: yPos,
          styles: { fontSize: 9 },
        });

        yPos = (doc.lastAutoTable?.finalY ?? 10) + 4;

        if (term.teacherRemarks) {
          yPos += 2;
          doc.setFontSize(10);
          doc.text("Teacher's Remark:", 14, yPos);
          yPos += 4;
          doc.setFontSize(9);
          doc.text(term.teacherRemarks, 14, yPos);
          yPos += 6;
        }
      });
    } else {
      doc.text("No results available yet.", 14, yPos);
    }

    doc.save(`academic-report-${studentResults?.studentInfo?.academicYear }.pdf`);
  };

  return (
    <div className="pb-8">
      <h1 className="text-md font-semibold text-neutral-800 mb-4">
        Academic Report 
        {studentResults?.studentInfo?.class &&<span className="font-normal">({studentResults?.studentInfo?.class})</span>}
      </h1>
      {showExportButton && studentResults?.terms?.length > 0 && (
        <div className="flex justify-end">
          <CustomButton
            text="Export Report"
            icon={<IconDownload size={16} />}
            onClick={handleExportPDF}
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

            {studentResults.terms.map((term, index) => {
              const avg = averagePercentage(
                term.subjects?.map((s) => s.percentage) ?? [],
              );
              const band = overallPerformanceBand(avg);

              return (
              <article
                key={index}
                className="mb-6 rounded-xl border border-zinc-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="text-md font-semibold text-neutral-800">
                    {term.termName || `Term ${index + 1}`}
                  </h2>
                  {band && avg != null ? (
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
                  ) : null}
                </div>

                <ResultsSubjectsTable
                  subjects={term.subjects ?? []}
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

                {term.subjects?.length > 0 && term.teacherRemarks ? (
                  <div className="mt-4 rounded-xl bg-zinc-50 px-4 py-3">
                    <p className="text-xs font-medium text-zinc-500 mb-1">
                      Class teacher remark
                    </p>
                    <p className="text-sm italic text-zinc-600">
                      {term.teacherRemarks}
                    </p>
                  </div>
                ) : null}
              </article>
            );
            })}
          </div>
        ) : (
          <NoAvailableEmptyState message="No results available yet." />
        )}

        <GradingLegendPanel
          bands={studentResults?.gradingLegend}
          passMark={studentResults?.passMark}
        />
      </div>
    </div>
  );
};

export default StudentResults;

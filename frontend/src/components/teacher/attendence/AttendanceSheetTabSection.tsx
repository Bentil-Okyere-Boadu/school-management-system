"use client";

import React, { useState } from "react";
import { SearchBar } from "@/components/common/SearchBar";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import Image from "next/image";
import Mark from "@/images/Mark.svg";
import Cancel from "@/images/Cancel.svg";
import { usePostClassAttendance, useGetClassAttendance } from "@/hooks/teacher";
import { ErrorResponse } from "@/@types";
import { toast } from "react-toastify";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  attendanceByDate: Record<string, "present" | "absent" | null>;
}

interface AttendanceData {
  classLevel: {
    id: string;
    name: string;
  }
  dateRange: {
    startDate: string;
    endDate: string;
    dates: string[];
  };
  students: Student[];
}

interface GetClassAttendance {
  attendanceData: AttendanceData; 
  refetch: () => void;
}


interface AttendanceSheetTabSectionProps {
  classId: string;
}

export const AttendanceSheetTabSection: React.FC<AttendanceSheetTabSectionProps> = ({ classId }) => {
  const [currentYear, setCurrentYear] = useState("");
  const [currentMonth, setCurrentMonth] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { attendanceData, refetch } = useGetClassAttendance(classId, "month", currentMonth, currentYear, "") as GetClassAttendance;
  const { mutate: markClassAttendanceMutation } = usePostClassAttendance(attendanceData?.classLevel?.id);

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>, type: "year" | "month") => {
    const value = event.target.value;
    if (type === "year") setCurrentYear(value);
    else if (type === "month") setCurrentMonth(value);
  };

  const monthOptions = [
    { label: 'Month', value: '' },
    ...Array.from({ length: 12 }, (_, i) => {
      const date = new Date(0, i);
      return {
        label: date.toLocaleString('default', { month: 'long' }),
        value: String(i + 1),
      };
    })
  ];

  const currentYearNumber = new Date().getFullYear();
  const yearOptions = [
    { label: "Year", value: "" },
    ...Array.from({ length: 10 }, (_, i) => {
      const year = currentYearNumber - i;
      return { label: String(year), value: String(year) };
    }),
  ];

  const handleSearch = (query: string) => setSearchQuery(query);

  const filteredStudents = attendanceData?.students?.filter((student: Student) =>
    student.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const handleStudentAttendance = (student: Student, selectedDate: string) => {
    const selected = new Date(selectedDate);
    const today = new Date();
    selected.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (selected > today) {
      toast.info("You can't mark attendance for a future date.");
      return;
    }

    const currentStatus = student?.attendanceByDate[selectedDate];
    const newStatus = (currentStatus === 'absent' || currentStatus == null) ? 'present' : 'absent';

    const payload = {
      date: selectedDate,
      records: [
        {
          studentId: student.id,
          status: newStatus as 'present' | 'absent',
        },
      ],
    };

    markClassAttendanceMutation(payload, {
      onSuccess: () => {
        toast.success('Attendance marked successfully.');
        refetch();
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      },
    });
  };

  return (
    <div className="pb-8">
      <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full" />

      <div className="flex gap-3 my-6">
        <CustomSelectTag value={currentMonth} options={monthOptions} onOptionItemClick={(e) => handleSelectChange(e as React.ChangeEvent<HTMLSelectElement>, "month")} />
        <CustomSelectTag value={currentYear} options={yearOptions} onOptionItemClick={(e) => handleSelectChange(e as React.ChangeEvent<HTMLSelectElement>, "year")} />
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-fit relative">
          <div className={`min-w-fit grid`} style={{ gridTemplateColumns: `200px 140px repeat(${attendanceData?.dateRange?.dates?.length || 0}, 3rem)` }}>
            {/* Header */}
            <div className="sticky left-0 z-10 bg-gray-100 px-4 py-5 text-xs font-medium text-gray-500">Name</div>
            <div className="sticky left-[200px] z-10 bg-gray-100 px-4 py-5 text-xs font-medium text-gray-500">Class/Grade</div>
            {attendanceData?.dateRange?.dates?.map((date, i) => (
              <div key={i} className="px-2 py-5 text-xs font-medium text-gray-500 text-center bg-gray-100">
                {new Date(date).getDate()}
              </div>
            ))}

            {/* Body */}
            {filteredStudents.map((student: Student) => (
              <React.Fragment key={student.id}>
                <div className="sticky left-0 z-10 bg-white px-4 py-5 border-b border-gray-200 whitespace-nowrap">
                  {student.fullName}
                </div>
                <div className="sticky left-[200px] z-10 bg-white px-4 py-5 border-b border-gray-200">
                  {attendanceData?.classLevel?.name}
                </div>
                {attendanceData?.dateRange?.dates?.map((date) => {
                  const status = student.attendanceByDate[date];
                  const present = status === "present";
                  const icon = status == null ? null : present ? Mark : Cancel;

                  return (
                    <div
                      key={date}
                      className={`px-2 py-5 border-b border-gray-200 flex items-center justify-center ${
                        new Date(date).getDay() === 0 || new Date(date).getDay() === 6
                          ? "bg-white none pointer-events-none"
                          : "bg-[#F9F5FF] cursor-pointer"
                      }`}
                      onClick={() => handleStudentAttendance(student, date)}
                    >
                      {icon ? (
                        <Image src={icon} alt={present ? "Present" : "Absent"} className="w-5 h-5 object-contain" width={20} height={20} />
                      ) : (
                        <span className="text-xs text-gray-300">–</span>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

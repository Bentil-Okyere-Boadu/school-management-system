"use client";

import React, { useEffect, useState } from "react";
// import { SearchBar } from "@/components/common/SearchBar";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import Image from "next/image";
import Mark from "@/images/Mark.svg";
import Cancel from "@/images/Cancel.svg";
import { useGetClassAttendance } from "@/hooks/school-admin";
import { useGetClassLevels } from "@/hooks/school-admin";
import { Pagination } from "@/components/common/Pagination";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  attendanceByDate: Record<string, "present" | "absent" | "weekend" | "holiday" | null>;
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

export const AttendanceSheetTabSection = () => {
  const [currentYear, setCurrentYear] = useState("");
  const [currentMonth, setCurrentMonth] = useState("");
  const [currentWeek, setCurrentWeek] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  // const [searchQuery, setSearchQuery] = useState("");


  const { classLevels } = useGetClassLevels();
  
  const getClasses = classLevels.map((classLevel) => { 
    return { value: classLevel.id, label: classLevel.name}
  })
  
  
  const { attendanceData } = useGetClassAttendance(selectedClass, "month", currentMonth, currentYear, currentWeek) as GetClassAttendance;
  
  useEffect(() => {
    if (getClasses.length > 0 && !selectedClass) {
      setSelectedClass(getClasses[0].value);
    }
  }, [getClasses, selectedClass]);

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>, type: "year" | "month" | "week") => {
    const value = event.target.value;
    if (type === "year") setCurrentYear(value);
    else if (type === "month") setCurrentMonth(value);
    else if (type === "week") setCurrentWeek(value);
  };

  const handleClassChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedClass(value)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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

  const weekOptions = [
    { label: "Week", value: "" },
    { label: "Week 1", value: "1" },
    { label: "Week 2", value: "2" },
    { label: "Week 3", value: "3" },
    { label: "Week 4", value: "4" },
    { label: "Week 5", value: "5" },
  ];

  // const handleSearch = (query: string) => setSearchQuery(query);

  // const filteredStudents = attendanceData?.students?.filter((student: Student) =>
  //   student.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  // ) ?? [];

  return (
    <div className="pb-8">
      {/* <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full" /> */}

      <div className="flex gap-3 my-6">
        <CustomSelectTag value={currentWeek} options={weekOptions} onOptionItemClick={(e) => handleSelectChange(e as React.ChangeEvent<HTMLSelectElement>, "week")} />
        <CustomSelectTag value={currentMonth} options={monthOptions} onOptionItemClick={(e) => handleSelectChange(e as React.ChangeEvent<HTMLSelectElement>, "month")} />
        <CustomSelectTag value={currentYear} options={yearOptions} onOptionItemClick={(e) => handleSelectChange(e as React.ChangeEvent<HTMLSelectElement>, "year")} />
        <CustomSelectTag value={selectedClass} options={getClasses} onOptionItemClick={(e) => handleClassChange(e as React.ChangeEvent<HTMLSelectElement>)} />
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
            {attendanceData?.students?.length > 0 ? 
              (
                attendanceData?.students?.map((student: Student) => (
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
                      const isWeekend = status === "weekend";
                      const isHoliday = status === "holiday";
                      const icon = status == null || isWeekend ? null : present ? Mark : Cancel;

                      return (
                        <div
                          key={date}
                          className={`px-2 py-5 border-b border-gray-200 flex items-center justify-center ${
                            new Date(date).getDay() === 0 || new Date(date).getDay() === 6
                              ? "bg-white none pointer-events-none"
                              : "bg-[#F9F5FF]"
                          } ${isHoliday && 'bg-[#FCEBCF]'}`}
                        >
                          {isHoliday ? (
                            <span className="text-[11px] font-bold text-black-500 rotate-[-45deg] whitespace-nowrap">Holiday</span>
                          ) :  icon ? (
                            <Image src={icon} alt={present ? "Present" : "Absent"} className="w-5 h-5 object-contain" width={20} height={20} />
                          ) : (
                            <span className="text-xs text-gray-300">–</span>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))
              ) : (
                <div className="col-span-full py-16 text-center font-semibold text-gray-600 bg-white">
                  <div className="w-[90vw]">
                    <p className="text-lg font-medium">No students found</p>
                    <p className="text-sm text-gray-400 mt-1">Once students are added to the class, they will appear in this table.</p>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={1}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

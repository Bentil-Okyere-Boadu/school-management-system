"use client";

import React, { useState } from "react";
import { SearchBar } from "@/components/common/SearchBar";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import { Menu } from "@mantine/core";
import { IconDots, IconMessageFilled } from "@tabler/icons-react";
import { Pagination } from "@/components/common/Pagination";
import { useGetClassAttendance, useGetClassLevels } from "@/hooks/school-admin";
import { useDebouncer } from "@/hooks/generalHooks";

interface AttendanceStats {
  totalMarkedDays: number;
  presentCount: number;
  absentCount: number;
  totalDaysInRange: number;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  statistics: AttendanceStats;
}

interface AttendanceData {
  classLevel: {
    id: string;
    name: string;
  };
  students: Student[];
}

interface GetAttendanceSummary {
  attendanceData: AttendanceData;
  refetch: () => void;
}

export const AttendanceSummaryTabSection: React.FC = () => {
  const [currentYear, setCurrentYear] = useState("");
  const [currentMonth, setCurrentMonth] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const { classLevels } = useGetClassLevels(useDebouncer(searchQuery));
  const getClasses = classLevels.map((classLevel) => {
    return { value: classLevel.id, label: classLevel.name };
  });

  const [selectedClass, setSelectedClass] = useState(getClasses[0]?.value);

  const { attendanceData } = useGetClassAttendance(
    selectedClass,
    "month",
    currentMonth,
    currentYear,
    "",
    true
  ) as GetAttendanceSummary;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    console.log(currentPage, searchQuery);
  };

  const handleSelectChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
    type: "year" | "month"
  ) => {
    const value = event.target.value;
    if (type === "year") setCurrentYear(value);
    else if (type === "month") setCurrentMonth(value);
  };

  const monthOptions = [
    { label: "Month", value: "" },
    ...Array.from({ length: 12 }, (_, i) => {
      const date = new Date(0, i);
      return {
        label: date.toLocaleString("default", { month: "long" }),
        value: String(i + 1),
      };
    }),
  ];

  const currentYearNumber = new Date().getFullYear();
  const yearOptions = [
    { label: "Year", value: "" },
    ...Array.from({ length: 10 }, (_, i) => {
      const year = currentYearNumber - i;
      return { label: String(year), value: String(year) };
    }),
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleClassChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedClass(value);
  };

  return (
    <div className="pb-8">
      {/* <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full" /> */}

      <div className="flex gap-3 my-6">
        <CustomSelectTag
          value={currentMonth}
          options={monthOptions}
          onOptionItemClick={(e) =>
            handleSelectChange(
              e as React.ChangeEvent<HTMLSelectElement>,
              "month"
            )
          }
        />
        <CustomSelectTag
          value={currentYear}
          options={yearOptions}
          onOptionItemClick={(e) =>
            handleSelectChange(
              e as React.ChangeEvent<HTMLSelectElement>,
              "year"
            )
          }
        />
        <CustomSelectTag
          value={selectedClass}
          options={getClasses}
          onOptionItemClick={(e) =>
            handleClassChange(e as React.ChangeEvent<HTMLSelectElement>)
          }
        />
      </div>

      <section className="bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-40 max-w-[240px]">
                  <div>Name</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                  <div>Class/Grade</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                  <div>Total Attendance</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[138px]">
                  <div>Present Count</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[138px]">
                  <div>Absent Count</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[138px]">
                  <div>Total days of Term</div>
                </th>
                <th className="pr-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-right max-md:px-5 underline cursor-pointer"></th>
              </tr>
            </thead>
            <tbody>
              {attendanceData?.students?.length > 0 ? (
                attendanceData.students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                      {attendanceData.classLevel.name}
                    </td>
                    <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                      {student.statistics.totalMarkedDays}
                    </td>
                    <td
                      className={`px-6 py-6 leading-none text-center border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5`}
                    >
                      {student.statistics.presentCount}
                    </td>
                    <td
                      className={`px-6 py-6 leading-none text-center border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5`}
                    >
                      {student.statistics.absentCount}
                    </td>
                    <td
                      className={`px-6 py-6 leading-none text-center border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5`}
                    >
                      {student.statistics.totalDaysInRange}
                    </td>
                    <td className="border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)]">
                      <div className="flex items-center justify-end pr-6">
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <IconDots className="cursor-pointer" />
                          </Menu.Target>
                          <Menu.Dropdown className="!-ml-12 !-mt-2">
                            <Menu.Item
                              onClick={() => {}}
                              leftSection={
                                <IconMessageFilled size={18} color="#AB58E7" />
                              }
                            >
                              Send Reminder
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                      <p className="text-lg font-medium">No users found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Once users are added, they will appear in this table.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={1}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

"use client";

import React, { useState } from "react";
// import { SearchBar } from "@/components/common/SearchBar";
// import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import { Menu, MultiSelect, Select } from "@mantine/core";
import { IconDots, IconMessageFilled } from "@tabler/icons-react";
import { useGetClassAttendance } from "@/hooks/teacher";
import { Pagination } from "@/components/common/Pagination";
import { Dialog } from "@/components/common/Dialog";
import StatCard from "./StatsCard";
import InputField from "@/components/InputField";
interface AttendanceSummaryTabSectionProps {
  classId: string;
}

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
  statistics: AttendanceStats
}

interface AttendanceData {
  classLevel: {
    id: string;
    name: string;
  }
  students: Student[],
  summary: Record<string, string>,
  pagination: Record<string, number>
}

interface GetAttendanceSummary {
  attendanceData: AttendanceData;
  refetch: () => void;
}

export const AttendanceSummaryTabSection: React.FC<AttendanceSummaryTabSectionProps> = ({ classId }) => {

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const { attendanceData } = useGetClassAttendance(classId, "month", '', '', "", true, startDate, endDate) as GetAttendanceSummary;

  const [currentPage, setCurrentPage] = useState(attendanceData?.pagination.page || 1);
  // const [searchQuery, setSearchQuery] = useState("");
  const [isSendReminderDialogOpen, setIsSendReminderDialogOpen] = useState(false);
  const [selectedTransmission, setSelectedTransmission] = useState<string[]>([]);
  const [selectedReminderTitle, setSelectedReminderTitle] = useState<string>();

  const transmissionList = [
    { label: 'Email', value: 'email' },
    { label: 'SMS', value: 'sms' }
  ];
  const reminderTitlesList = [
    { label: 'Fee due Date Reminder', value: 'fee-due' },
    { label: 'Absent Notice', value: 'absent-notice' },
  ];

  // const handleSearch = (query: string) => {
  //   setSearchQuery(query);
  //   setCurrentPage(1);
  //   console.log(currentPage, searchQuery);
  // };

   const classSummary = attendanceData?.summary
    const stats = [
      {
        label: "Total Attendance Count",
        value: String(classSummary?.totalAttendanceCount ?? 0),
        fromColor: "#2B62E5",
        toColor: "#8FB5FF",
      },
      {
        label: "Total Present Count",
        value: String(classSummary?.totalPresentCount ?? 0),
        fromColor: "#B55CF3",
        toColor: "#D9A6FD",
      },
      {
        label: "Total Absent Count",
        value: String(classSummary?.totalAbsentCount ?? 0),
        fromColor: "#F15580",
        toColor: "#F88FB3",
      },
      {
        label: "Average Attendance Rate",
        value: String(classSummary?.averageAttendanceRate ?? 0) + "%",
        fromColor: "#30C97A",
        toColor: "#8DF4B8",
      },
    ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTransmissionChange = (value: string[]) => {
    setSelectedTransmission(value);
  };

  const handleReminderTitle = (event: string) => {
    setSelectedReminderTitle(event);
  };

  const onSenderReminderActionClick = () => {
    console.log(selectedReminderTitle, selectedTransmission);
  };

  return (
    <div className="pb-8 px-0.5">
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-6 px-0.5">
      {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
      ))}
      </section>
      {/* <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full" /> */}

      <div className="flex gap-3 my-6">
        <div className="flex items-center">
          <label>Select date range:</label>
        </div>
        <InputField type="date" label="Start Date" value={startDate} onChange={(e) => setStartDate(e.target.value)}/>
        <InputField type="date" label="End Date" value={endDate} onChange={(e) => {setEndDate(e.target.value)}}/>
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
              {attendanceData?.students?.length > 0 ? (attendanceData.students.map((student) => (
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
                  <td
                    className="border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)]"
                  >
                    <div className="flex items-center justify-end pr-6">
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <IconDots className="cursor-pointer" />
                        </Menu.Target>
                        <Menu.Dropdown className="!-ml-12 !-mt-2">
                          <Menu.Item 
                            onClick={() => setIsSendReminderDialogOpen(false)} 
                            leftSection={<IconMessageFilled size={18} color="#AB58E7" />}>
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
                      <p className="text-sm text-gray-400 mt-1">Once users are added, they will appear in this table.</p>
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
        totalPages={attendanceData?.pagination.totalPages || 1}
        onPageChange={handlePageChange}
      />

      
      {/* Send Reminder dialog */}
      <Dialog
        isOpen={isSendReminderDialogOpen}
        dialogTitle="Send Reminder"
        saveButtonText="Send"
        onClose={() => {
          setIsSendReminderDialogOpen(false);
        }}
        onSave={onSenderReminderActionClick}
        busy={false}
      >
        <p className="text-xs text-gray-500">
          Select the mode and message to send a reminder
        </p>
        <div className="my-3 flex flex-col gap-2">
          <Select
            label="Reminder Title"
            placeholder="Please Select"
            className="mb-3"
            data={reminderTitlesList}
            value={selectedReminderTitle}
            onChange={(e) => handleReminderTitle(e as string)}
          />

          <MultiSelect
            label="Send via"
            placeholder="Please Select"
            className="mb-5"
            data={transmissionList}
            value={selectedTransmission}
            onChange={handleTransmissionChange}
            withCheckIcon
          />
        </div>
      </Dialog>
    </div>
  );
}
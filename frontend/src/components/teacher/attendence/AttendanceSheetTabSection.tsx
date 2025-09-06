"use client";

import React, { useState } from "react";
// import { SearchBar } from "@/components/common/SearchBar";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import Image from "next/image";
import Mark from "@/images/Mark.svg";
import Cancel from "@/images/Cancel.svg";
import { usePostClassAttendance, useGetClassAttendance, useTeacherGetMe, useApproveClassResults } from "@/hooks/teacher";
import { ErrorResponse, MissingGrade, NotificationType } from "@/@types";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { Pagination } from "@/components/common/Pagination";
import { useCreateNotification } from "@/hooks/school-admin";
import { Button } from "@mantine/core";
import { Dialog } from "@/components/common/Dialog";

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


interface AttendanceSheetTabSectionProps {
  classId: string;
}

export const AttendanceSheetTabSection: React.FC<AttendanceSheetTabSectionProps> = ({ classId }) => {
  const [currentYear, setCurrentYear] = useState("");
  const [currentMonth, setCurrentMonth] = useState("");
  const [currentWeek, setCurrentWeek] = useState("");
  // const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingCell, setLoadingCell] = useState<{ studentId: string; date: string } | null>(null);

  const [isMissingGradesDialogOpen, setIsMissingGradesDialogOpen] = useState(false);
  const [missingGrades, setMissingGrades] = useState<MissingGrade[]>();
  

  const queryClient = useQueryClient();

  const { attendanceData, refetch } = useGetClassAttendance(classId, "month", currentMonth, currentYear, currentWeek) as GetClassAttendance;
  const { mutate: markClassAttendanceMutation } = usePostClassAttendance(attendanceData?.classLevel?.id);
  const {mutate: createNotification} = useCreateNotification();
  const {me} = useTeacherGetMe();
  const { mutate: approveResults, isPending: approveResultPending } = useApproveClassResults();

  // const {isClassTeacher} = useIsClassTeacher(classId as string);

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>, type: "year" | "month" | "week") => {
    const value = event.target.value;
    if (type === "year") setCurrentYear(value);
    else if (type === "month") setCurrentMonth(value);
    else if (type === "week") setCurrentWeek(value);
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
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // const filteredStudents = attendanceData?.students?.filter((student: Student) =>
  //   student.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  // ) ?? [];

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

    setLoadingCell({ studentId: student.id, date: selectedDate }); // start loading

    markClassAttendanceMutation(payload, {
      onSuccess: () => {
        toast.success('Attendance marked successfully.');
        
        if(newStatus === 'absent') {
          createNotification({
            title: "Student Absent",
            message: `${student.fullName} marked as ${newStatus} for ${new Date(selectedDate).toLocaleDateString()}`,
            type: NotificationType.Attendance,
            schoolId: me.school.id
          });
        }
        refetch();
        queryClient.invalidateQueries({ queryKey: ['summary']})
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      },
      onSettled: () => {
        setLoadingCell(null); // stop loading
      },
    });
  };


  const onApproveClassResult = () => {
    const payload = {
      classLevelId: classId,
      action: "approve",
      forceApprove: false,
    };
    
    approveResults(payload, {
      onSuccess: (data) => {
        if(data?.data?.missingGrades?.length > 0) {
          setMissingGrades(data?.data?.missingGrades);
          setIsMissingGradesDialogOpen(true);
        } else {
          // no missing subject scores
          onConfirmClassResultApproval();
        }
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      },
    });
  }

  const onConfirmClassResultApproval = () => {
    const payload = {
      classLevelId: classId,
      action: "approve",
      forceApprove: true,
    };

    approveResults(payload, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['classResults'] });
        console.log(data?.data, "response")
        setIsMissingGradesDialogOpen(false);
        toast.success('Class results approved successfully');
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      },
    });
  }

  return (
    <div className="pb-8 px-0.5">
      {/* <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full px-0.5" /> */}

      <div className="flex gap-3 my-6 justify-between">
        <div className="flex gap-3">
        <CustomSelectTag value={currentWeek} options={weekOptions} onOptionItemClick={(e) => handleSelectChange(e as React.ChangeEvent<HTMLSelectElement>, "week")} />
        <CustomSelectTag value={currentMonth} options={monthOptions} onOptionItemClick={(e) => handleSelectChange(e as React.ChangeEvent<HTMLSelectElement>, "month")} />
        <CustomSelectTag value={currentYear} options={yearOptions} onOptionItemClick={(e) => handleSelectChange(e as React.ChangeEvent<HTMLSelectElement>, "year")} />
        </div>
        <Button onClick={() => onApproveClassResult()} disabled={approveResultPending}>
          Approve Result
        </Button>
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
                              : "bg-[#F9F5FF] cursor-pointer"
                          } ${isHoliday && 'bg-[#FCEBCF] pointer-events-none'}`}
                          onClick={() => handleStudentAttendance(student, date)}
                        >
                          {loadingCell?.studentId === student.id && loadingCell?.date === date ? (
                            <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : isHoliday ? (
                            <span className="text-[11px] font-bold text-black-500 rotate-[-45deg] whitespace-nowrap">Holiday</span>
                          ) : icon ? (
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

      {/* Missing Grades Dialog */}
      <Dialog 
        isOpen={isMissingGradesDialogOpen}
        busy={false}
        dialogTitle="Missing Grades"
        subheader="Some students have missing grades. Approval not completed."
        saveButtonText="Confirm Approval"
        onSave={() => {onConfirmClassResultApproval()}} 
        onClose={() => setIsMissingGradesDialogOpen(false)}
      >
        <div className="my-3">
          <ol className="relative border-l border-gray-200">
            {missingGrades?.map((item) => (
              <li key={item.student.id} className="mb-10 ml-4">
                {/* Student marker */}
                <div className="absolute -left-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-[#AB58E7] ring-4 ring-white"></div>

                {/* Student info */}
                <h3 className="text-base font-semibold text-gray-900">
                  {item.student.firstName} {item.student.lastName}
                </h3>
                <p className="mb-2 text-sm text-gray-500">
                  {item.missingSubjects.length} missing subject score
                  {item.missingSubjects.length > 1 ? "s" : ""}
                </p>

                {/* Subject badges */}
                <div className="flex flex-wrap gap-2">
                  {item.missingSubjects.map((subject) => (
                    <span
                      key={subject.subjectId}
                      className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1 text-sm"
                    >
                      <span className="font-medium">{subject.subjectName}</span>
                      <span className="text-xs text-gray-500">
                        {subject.teacher.firstName} {subject.teacher.lastName}
                      </span>
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Dialog>
    </div>
  );
};

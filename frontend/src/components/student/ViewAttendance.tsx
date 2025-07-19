import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import InputField from "@/components/InputField";
import {
useGetClassAttendance, useGetCalendars,
} from "@/hooks/student";
import Image from "next/image";
import Mark from "@/images/Mark.svg";
import Cancel from "@/images/Cancel.svg";
import React, { useState } from "react";
import { StudentAttendanceData } from "@/@types";

interface AttendanceData {
  studentAttendance: StudentAttendanceData;
  isLoading: boolean;
  refetch: () => void
}
interface StudentAttendanceProps {
  classLevelId: string;
}

const ViewAttendance = ({ classLevelId }: StudentAttendanceProps) => {
  const { studentCalendars } = useGetCalendars();

  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");

  const { studentAttendance } = useGetClassAttendance(
    classLevelId,
    selectedAcademicYear
  ) as AttendanceData;

  const academicYears = studentCalendars?.map((calendar) => {
    return { value: calendar.id, label: calendar.name };
  });

  console.log(studentAttendance, 'att')

  const handleSelectAcademicYear = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selected = event.target.value;
    setSelectedAcademicYear(selected);
  };

  const presentPercentage = (studentAttendance?.summary.totalPresentCount / studentAttendance?.summary.totalAttendanceCount) * 100 || 0 + '%'
  const absentPercentage = (studentAttendance?.summary.totalAbsentCount / studentAttendance?.summary.totalAttendanceCount) * 100 || 0 + '%'

  return (
    <div>
      <div>
        <h3 className="my-4 font-bold">Attendance Summary</h3>
        <div className="mb-5">Select Academic Year</div>
        <CustomSelectTag
          options={academicYears || []}
          optionLabel="Academic Year"
          onOptionItemClick={handleSelectAcademicYear}
        />
      </div>
      <div className="my-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
          <InputField
            className="!py-0 w-[40px]"
            label="Attendance Count"
            value={studentAttendance?.summary.totalAttendanceCount as unknown as string}
            isTransulent={true}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
          <InputField
            className="!py-0"
            label="Present Count"
            value={studentAttendance?.summary.totalPresentCount as unknown as string}
            isTransulent={true}
          />
          <InputField
            className="!py-0"
            label="Present Percentage"
            value={presentPercentage as string}
            isTransulent={true}
          />
          <InputField
            className="!py-0"
            label="Absent Count"
            value={studentAttendance?.summary.totalAbsentCount as unknown as string}
            isTransulent={true}
          />
          <InputField
            className="!py-0"
            label="Absent Percentage"
            value={absentPercentage as string}
            isTransulent={true}
          />
        </div>
      </div>
      <div>
        <h3 className="my-4 font-bold">Attendance Sheet</h3>
        <div className="overflow-x-auto mb-5">
          <div className="min-w-fit relative">
            {
              studentAttendance?.terms.length > 0 ? (
                studentAttendance?.terms.map((term, index) => (
              <div key={index} className="px-4">
                <p className="bg-gray-100 py-3 text-md font-medium text-gray-500">
                  {term.termName}
                </p>
                <div className="flex">
                  <span className="text-sm font-medium text-gray-500">
                    {term.startDate}
                  </span>
                  <span className="before:content-['-'] before:mx-1 text-sm font-medium text-gray-500">
                    {term.endDate}
                  </span>
                </div>

                {term?.months?.map((month, index) => (
                  <div key={index} className="py-4">
                    <p className="text-xs pt-2 text-gray-500">
                      {new Date(Number(`${month.year}`), Number(month.month - 1), 1).toLocaleString('default', { month: 'long'})} {month.year}
                    </p>
                    <div
                      className={`min-w-fit grid`}
                      style={{
                        gridTemplateColumns: `repeat(${
                          month?.attendance.dateRange?.dates?.length || 0
                        }, 3rem)`,
                      }}
                    >
                      {month?.attendance.dateRange?.dates?.map((date, i) => (
                        <div
                          key={i}
                          className="px-2 py-5 text-xs font-medium text-gray-500 text-center bg-blue-50"
                        >
                          {new Date(date).getDate()}
                        </div>
                      ))}
                      <React.Fragment key={month?.attendance.student.id}>
                        {month?.attendance.dateRange?.dates?.map(
                          (date, index) => {
                            const status =
                              month?.attendance.student.attendanceByDate[date];
                            const present = status === "present";
                            const isWeekend = status === "weekend";
                            const isHoliday = status === "holiday";
                            const icon =
                              status == null || isWeekend
                                ? null
                                : present
                                ? Mark
                                : Cancel;

                            return (
                              <div
                                key={index}
                                className={`px-2 py-5 border-b border-gray-200 flex items-center justify-center ${
                                  new Date(date).getDay() === 0 ||
                                  new Date(date).getDay() === 6
                                    ? "bg-white none pointer-events-none"
                                    : "bg-[#F9F5FF] cursor-pointer"
                                } ${
                                  isHoliday &&
                                  "bg-[#FCEBCF] pointer-events-none"
                                }`}
                                onClick={() => {}}
                              >
                                {isHoliday ? (
                                  <span className="text-[11px] font-bold text-black-500 rotate-[-45deg] whitespace-nowrap">
                                    Holiday
                                  </span>
                                ) : icon ? (
                                  <Image
                                    src={icon}
                                    alt={present ? "Present" : "Absent"}
                                    className="w-5 h-5 object-contain"
                                    width={20}
                                    height={20}
                                  />
                                ) : (
                                  <span className="text-xs text-gray-300">
                                    –
                                  </span>
                                )}
                              </div>
                            );
                          }
                        )}
                      </React.Fragment>
                    </div>
                  </div>
                ))}
              </div>
            ))
              ) : (
                <table className="w-full border-collapse min-w-[500px]">
                  <tbody>
                    <tr>
                    <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                      <p className="text-lg font-medium">Attendance Information Not Available</p>
                      <p className="text-sm text-gray-400 mt-1">Once attendance information is added for the academic year, they will appear here.</p>
                    </div>
                  </td>
                </tr>
                  </tbody>
                </table>
              )
            }
            
          </div>
        </div>
      </div>
    </div>
  )
};

export default ViewAttendance;

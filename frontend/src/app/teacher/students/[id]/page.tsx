"use client"

import React, { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Student, StudentAttendanceData } from '@/@types';
import StudentAttendance from '@/components/admin/students/StudentAttendance';
import StudentProfile from '@/components/admin/students/StudentProfile';
import TabBar from '@/components/common/TabBar';
import { useGetStudentById, useAdminViewStudentAttendance, useGetCalendars, useGetStudentTermResults,  } from '@/hooks/teacher';
import StudentResults from '@/components/teacher/students/StudentResults';

export type TabListItem = {
  tabLabel: string;
  tabKey: string;
};

interface AttendanceData {
  studentAttendance: StudentAttendanceData;
  isLoading: boolean;
  refetch: () => void
}

const ViewStudentPage = () => {
    const {id} = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    const {studentData, refetch} = useGetStudentById(id as string)

    const tabFromUrl = searchParams.get("tab");
    const [activeTabKey, setActiveTabKey] = useState(tabFromUrl || "student-profile");
    
    const handleItemClick = (item: TabListItem) => {
        setActiveTabKey(item.tabKey);
        setTabInUrl(item.tabKey);
    };

    const setTabInUrl = (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.push(`?${params.toString()}`);
    };

    const defaultNavItems: TabListItem[] = [
      { tabLabel: "Student Profile", tabKey: "student-profile" },
      { tabLabel: "Attendance", tabKey: "attendance" },
      { tabLabel: "Results", tabKey: "results" },
    ];

    const [selectedAcademicYear, setSelectedAcademicYear] = useState("");

    const { studentAttendance } = useAdminViewStudentAttendance(
      (studentData as Student)?.classLevels?.[0]?.id,
      id as string,
      selectedAcademicYear
    ) as AttendanceData;
    const { studentCalendars } = useGetCalendars();

    const handleSelectAcademicYear = (academicYearId: string) => {
      setSelectedAcademicYear(academicYearId);
    };

    const [selectedResultYear, setSelectedResultYear] = useState("");
    const [selectedResultTerm, setSelectedResultTerm] = useState("");

    const { resultsData: studentResultsData } = useGetStudentTermResults(
      id as string,
      selectedResultYear,
      selectedResultTerm,
      {
        enabled: !!id && !!selectedResultYear && !!selectedResultTerm,
        queryKey: ['studentTermResults', id, selectedResultYear, selectedResultTerm],
      }
    );

  return (
    <div className='px-0.5'>
        <TabBar 
          items={defaultNavItems} 
          activeTabKey={activeTabKey} 
          onItemClick={handleItemClick} // triggered from the child, it will in return trigger handleItemClick function
        />

        { activeTabKey === "student-profile" && (
            <div>
                <StudentProfile viewMode={true} studentData={studentData as Student} refetch={refetch}/>
            </div>
        )}
        { activeTabKey === "attendance" && (
            <div>
              <StudentAttendance  
                studentAttendance={studentAttendance}
                calendars={studentCalendars}
                onSelectAcademicYear={handleSelectAcademicYear}
                />
            </div>
        )}

        { activeTabKey === "results" && (
          <div>
            <StudentResults
              calendars={studentCalendars}
              studentResults={studentResultsData}
              studentId={id as string}
              onCalendarChange={(calendarId) => setSelectedResultYear(calendarId)}
              onTermChange={(termId) => setSelectedResultTerm(termId)}
            />
          </div>
        )}
    </div>
  )
}


export default ViewStudentPage
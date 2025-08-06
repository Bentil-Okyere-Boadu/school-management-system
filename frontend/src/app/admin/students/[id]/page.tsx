"use client"
import { Calendar, Student, StudentAttendanceData } from '@/@types';
import StudentAttendance from '@/components/admin/students/StudentAttendance';
import StudentProfile from '@/components/admin/students/StudentProfile';
import StudentResults from '@/components/admin/students/StudentResults';
import TabBar from '@/components/common/TabBar';
import { useAdminViewStudentAttendance, useGetCalendars, useGetSchoolUserById, useGetStudentResults } from '@/hooks/school-admin';
import { useParams, useSearchParams, useRouter } from "next/navigation";
import React, { useState } from 'react'

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
    const searchParams = useSearchParams();
    const router = useRouter();

    const {schoolUser, refetch} = useGetSchoolUserById(id as string)
    
    const tabFromUrl = searchParams.get("tab");
    const [activeTabKey, setActiveTabKey] = useState(tabFromUrl || 'student-profile');
    
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
    const [selectedResultYear, setSelectedResultYear] = useState("");

    const { studentAttendance } = useAdminViewStudentAttendance(
      (schoolUser as Student)?.classLevels?.[0]?.id,
      id as string,
      selectedAcademicYear
    ) as AttendanceData;
    const { calendars } = useGetCalendars();


    const handleSelectAcademicYear = (academicYearId: string) => {
      setSelectedAcademicYear(academicYearId);
    };

    const { resultsData: studentResults } = useGetStudentResults(id as string, selectedResultYear, {
      enabled: !!id && !!selectedResultYear,
      queryKey: ['studentResult', id, selectedResultYear],
    });

  return (
    <div className='px-0.5'>
        <TabBar 
          items={defaultNavItems} 
          activeTabKey={activeTabKey} 
          onItemClick={handleItemClick} // triggered from the child, it will in return trigger handleItemClick function
        />

        { activeTabKey === "student-profile" && (
            <div>
                <StudentProfile viewMode={true} studentData={schoolUser as Student} refetch={refetch}/>
            </div>
        )}
        { activeTabKey === "attendance" && (
            <div>
              <StudentAttendance 
                studentAttendance={studentAttendance}
                calendars={calendars}
                onSelectAcademicYear={handleSelectAcademicYear}
              />
            </div>
        )}
        { activeTabKey === "results" && (
            <div>
                <StudentResults 
                  calendars={calendars as Calendar[]}
                  studentResults={studentResults}
                  showExportButton={false}
                  onCalendarChange={(calendarId) => setSelectedResultYear(calendarId)}
                />
            </div>
        )}
    </div>
  )
}


export default ViewStudentPage
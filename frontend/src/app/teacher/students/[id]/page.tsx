"use client"

import React, { useEffect, useMemo, useState } from 'react';
import { getSortedSchoolTerms } from '@/utils/schoolTerms';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Student, StudentAttendanceData } from '@/@types';
import StudentAttendance from '@/components/admin/students/StudentAttendance';
import StudentProfile from '@/components/admin/students/StudentProfile';
import TabBar from '@/components/common/TabBar';
import StudentPerformanceAnalytics from '@/components/common/StudentPerformanceAnalytics';
import { useGetStudentById, useAdminViewStudentAttendance, useGetCalendars, useGetStudentTermResults, useTeacherStudentPerformanceAnalytics,  } from '@/hooks/teacher';
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
    const schoolId = studentData?.school.id;

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
      { tabLabel: "Analytics", tabKey: "analytics" },
    ];

    const [selectedAcademicYear, setSelectedAcademicYear] = useState("");

    const { studentAttendance } = useAdminViewStudentAttendance(
      (studentData as Student)?.classLevels?.[0]?.id,
      id as string,
      selectedAcademicYear
    ) as AttendanceData;
    const { studentCalendars, isLoading: calendarsLoading } = useGetCalendars();

    const sortedAnalyticsTerms = useMemo(
      () => getSortedSchoolTerms(studentCalendars ?? []),
      [studentCalendars],
    );

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

    const [selectedAnalyticsTerm, setSelectedAnalyticsTerm] = useState("");

    useEffect(() => {
      if (sortedAnalyticsTerms.length === 0) return;
      setSelectedAnalyticsTerm((prev) => {
        if (prev && sortedAnalyticsTerms.some((t) => t.id === prev)) return prev;
        return sortedAnalyticsTerms[0].id;
      });
    }, [sortedAnalyticsTerms]);

    const { analytics: performanceAnalytics, isLoading: analyticsLoading } =
      useTeacherStudentPerformanceAnalytics(id as string, selectedAnalyticsTerm, {
        enabled:
          !!id &&
          !!selectedAnalyticsTerm &&
          activeTabKey === "analytics",
        queryKey: ["teacherStudentAnalytics", id, selectedAnalyticsTerm],
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
              schoolId={schoolId}
              onCalendarChange={(calendarId) => setSelectedResultYear(calendarId)}
              onTermChange={(termId) => setSelectedResultTerm(termId)}
            />
          </div>
        )}
        { activeTabKey === "analytics" && (
          <div>
            <StudentPerformanceAnalytics
              calendars={(studentCalendars as Calendar[]) ?? []}
              calendarsLoading={calendarsLoading}
              selectedTermId={selectedAnalyticsTerm}
              onTermChange={setSelectedAnalyticsTerm}
              analytics={performanceAnalytics}
              isLoading={analyticsLoading}
              teacherScoped
            />
          </div>
        )}
    </div>
  )
}


export default ViewStudentPage
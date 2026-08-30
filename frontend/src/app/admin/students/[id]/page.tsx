"use client"
import { Calendar, Student, StudentAttendanceData } from '@/@types';
import StudentAttendance from '@/components/admin/students/StudentAttendance';
import StudentProfile from '@/components/admin/students/StudentProfile';
import StudentResults from '@/components/admin/students/StudentResults';
import TabBar from '@/components/common/TabBar';
import StudentPerformanceAnalytics from '@/components/common/StudentPerformanceAnalytics';
import { useAdminStudentPerformanceAnalytics, useAdminViewStudentAttendance, useGetCalendars, useGetMe, useGetMySchool, useGetSchoolUserById, useGetStudentResults } from '@/hooks/school-admin';
import { useParams, useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from 'react'
import { getSortedSchoolTerms } from '@/utils/schoolTerms';
import {
  isPerformanceAnalyticsEnabled,
  isPerformanceAnalyticsEnabledResolved,
} from '@/utils/performanceAnalytics';

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
    const { me, isPending: meLoading } = useGetMe();
    const { school, isLoading: schoolLoading } = useGetMySchool();
    const schoolContext = school ?? me?.school;
    const flagLoading = meLoading || schoolLoading;
    const performanceAnalyticsEnabled = isPerformanceAnalyticsEnabled(schoolContext, {
      isLoading: flagLoading,
    });
    
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

    const defaultNavItems: TabListItem[] = useMemo(
      () => [
        { tabLabel: "Student Profile", tabKey: "student-profile" },
        { tabLabel: "Attendance", tabKey: "attendance" },
        { tabLabel: "Results", tabKey: "results" },
        ...(performanceAnalyticsEnabled
          ? [{ tabLabel: "Analytics", tabKey: "analytics" }]
          : []),
      ],
      [performanceAnalyticsEnabled],
    );

    useEffect(() => {
      if (
        flagLoading ||
        isPerformanceAnalyticsEnabledResolved(schoolContext) ||
        activeTabKey !== "analytics"
      ) {
        return;
      }
      setActiveTabKey("student-profile");
      setTabInUrl("student-profile");
    }, [activeTabKey, flagLoading, schoolContext, searchParams, router]);
    
    const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
    const [selectedResultYear, setSelectedResultYear] = useState("");
    const [selectedAnalyticsTerm, setSelectedAnalyticsTerm] = useState("");

    const { studentAttendance } = useAdminViewStudentAttendance(
      (schoolUser as Student)?.classLevels?.[0]?.id,
      id as string,
      selectedAcademicYear
    ) as AttendanceData;
    const { calendars, isLoading: calendarsLoading } = useGetCalendars();

    const sortedAnalyticsTerms = useMemo(
      () => getSortedSchoolTerms(calendars ?? []),
      [calendars],
    );

    useEffect(() => {
      if (sortedAnalyticsTerms.length === 0) return;
      setSelectedAnalyticsTerm((prev) => {
        if (prev && sortedAnalyticsTerms.some((t) => t.id === prev)) return prev;
        return sortedAnalyticsTerms[0].id;
      });
    }, [sortedAnalyticsTerms]);

    const handleSelectAcademicYear = (academicYearId: string) => {
      setSelectedAcademicYear(academicYearId);
    };

    const { resultsData: studentResults } = useGetStudentResults(id as string, selectedResultYear, {
      enabled: !!id && !!selectedResultYear,
      queryKey: ['studentResult', id, selectedResultYear],
    });

    const { analytics: performanceAnalytics, isLoading: analyticsLoading } =
      useAdminStudentPerformanceAnalytics(id as string, selectedAnalyticsTerm, {
        enabled:
          performanceAnalyticsEnabled &&
          !!id &&
          !!selectedAnalyticsTerm &&
          activeTabKey === "analytics",
        queryKey: ["studentAnalytics", id, selectedAnalyticsTerm],
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
                <StudentProfile viewMode={true} studentData={schoolUser as Student} refetch={refetch} canManageGuardians={true}/>
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
                  studentData={{} as Student}
                  calendars={calendars as Calendar[]}
                  studentResults={studentResults}
                  showExportButton={false}
                  onCalendarChange={(calendarId) => setSelectedResultYear(calendarId)}
                />
            </div>
        )}
        { activeTabKey === "analytics" && performanceAnalyticsEnabled && (
            <div className='mt-6'>
              <StudentPerformanceAnalytics
                calendars={(calendars as Calendar[]) ?? []}
                calendarsLoading={calendarsLoading}
                selectedTermId={selectedAnalyticsTerm}
                onTermChange={setSelectedAnalyticsTerm}
                analytics={performanceAnalytics}
                isLoading={analyticsLoading}
              />
            </div>
        )}
    </div>
  )
}


export default ViewStudentPage
"use client"
import { Calendar, Student } from '@/@types';
import StudentProfile from '@/components/admin/students/StudentProfile'
import StudentPerformanceAnalytics from '@/components/common/StudentPerformanceAnalytics';
import TabBar from '@/components/common/TabBar';
import { useGetCalendars, useStudentGetMe, useStudentPerformanceAnalytics } from '@/hooks/student';
import { getSortedSchoolTerms } from '@/utils/schoolTerms';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react'

type TabListItem = {
  tabLabel: string;
  tabKey: string;
};

const StudentDashboard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTabKey, setActiveTabKey] = useState(tabFromUrl || "student-profile");
  const [selectedAnalyticsTerm, setSelectedAnalyticsTerm] = useState("");

  const { me, refetch } = useStudentGetMe();
  const { studentCalendars, isLoading: calendarsLoading } = useGetCalendars();

  const sortedAnalyticsTerms = useMemo(
    () => getSortedSchoolTerms(studentCalendars ?? []),
    [studentCalendars],
  );

  useEffect(() => {
    if (sortedAnalyticsTerms.length === 0) return;
    setSelectedAnalyticsTerm((prev) => {
      if (prev && sortedAnalyticsTerms.some((t) => t.id === prev)) return prev;
      return sortedAnalyticsTerms[0].id;
    });
  }, [sortedAnalyticsTerms]);

  const { analytics: performanceAnalytics, isLoading: analyticsLoading } =
    useStudentPerformanceAnalytics(selectedAnalyticsTerm, {
      enabled: !!selectedAnalyticsTerm && activeTabKey === "analytics",
      queryKey: ["studentProfileAnalytics", selectedAnalyticsTerm],
    });

  const defaultNavItems: TabListItem[] = [
    { tabLabel: "Student Profile", tabKey: "student-profile" },
    { tabLabel: "Analytics", tabKey: "analytics" },
  ];

  const setTabInUrl = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  };

  const handleItemClick = (item: TabListItem) => {
    setActiveTabKey(item.tabKey);
    setTabInUrl(item.tabKey);
  };

  return (
    <div className='px-0.5'>
      <TabBar
        items={defaultNavItems}
        activeTabKey={activeTabKey}
        onItemClick={handleItemClick}
      />

      {activeTabKey === "student-profile" && (
        <StudentProfile studentData={me as Student} viewMode={false} refetch={refetch} canManageGuardians={true} />
      )}

      {activeTabKey === "analytics" && (
        <div className='mt-6'>
          <StudentPerformanceAnalytics
            calendars={(studentCalendars as Calendar[]) ?? []}
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

export default StudentDashboard
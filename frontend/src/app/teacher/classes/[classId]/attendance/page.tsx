"use client"
import React, { useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import TabBar from '@/components/common/TabBar';
import { AttendanceSheetTabSection } from '@/components/teacher/attendence/AttendanceSheetTabSection';
import { AttendanceSummaryTabSection } from '@/components/teacher/attendence/AttendanceSummaryTabSection';
import { ClassEnrolledStudentsTable } from '@/components/admin/classes/ClassEnrolledStudentsTable';
import { useGetTeacherClassDetail } from '@/hooks/teacher';
import { Student } from '@/@types';
import FullPageSpinner from '@/components/common/FullPageSpinner';

export type TabListItem = {
  tabLabel: string;
  tabKey: string;
};

const ClassAttendance = () => {

  const { classId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = classId as string;

  const { classDetail, isPending } = useGetTeacherClassDetail(id);
  const enrolledStudents = (classDetail?.students ?? []) as Student[];

  const defaultNavItems: TabListItem[] = [
    { tabLabel: "Students", tabKey: "students" },
    { tabLabel: "Attendance Sheet", tabKey: "attendance-sheet" },
    { tabLabel: "Attendance Summary", tabKey: "attendance-summary" },
  ];

  const tabFromUrl = searchParams.get("tab");
  const [activeTabKey, setActiveTabKey] = useState(tabFromUrl || 'students');

  const handleItemClick = (item: TabListItem) => {
    setActiveTabKey(item.tabKey);
    setTabInUrl(item.tabKey)
  };

  const setTabInUrl = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="pb-8">
      <div>
        <TabBar 
            items={defaultNavItems} 
            activeTabKey={activeTabKey} 
            onItemClick={handleItemClick}
        />

        {activeTabKey === "students" && (
            <div className="mt-4">
                {isPending ? (
                  <FullPageSpinner />
                ) : (
                  <ClassEnrolledStudentsTable
                    students={enrolledStudents}
                    isRemoveMode={false}
                    profileBasePath="/teacher/students"
                  />
                )}
            </div>
        )}

        {activeTabKey === "attendance-sheet" && (
            <div>
                <AttendanceSheetTabSection classId={id} />
            </div>
        )}

        {activeTabKey === "attendance-summary" && (
            <div>
                <AttendanceSummaryTabSection classId={id}/>
            </div>
        )}
      </div>
    </div>
  );
}

export default ClassAttendance

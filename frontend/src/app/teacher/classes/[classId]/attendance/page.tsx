"use client"
import React, { useState } from 'react'
import { useParams } from 'next/navigation';
import StatCard from '@/components/teacher/attendence/StatsCard';
import TabBar from '@/components/common/TabBar';
import { AttendanceSheetTabSection } from '@/components/teacher/attendence/AttendanceSheetTabSection';
import { AttendanceSummaryTabSection } from '@/components/teacher/attendence/AttendanceSummaryTabSection';
import { useTeacherAttendanceSummary } from '@/hooks/teacher';

export type TabListItem = {
  tabLabel: string;
  tabKey: string;
};

const ClassAttendance = () => {

  const { classId } = useParams();
  const {classSummary} = useTeacherAttendanceSummary(classId as string);
  const stats = [
    {
      label: "Total Attendance Count",
      value: classSummary?.totalAttendanceCount,
      fromColor: "#2B62E5",
      toColor: "#8FB5FF",
    },
    {
      label: "Total Present Count",
      value: classSummary?.totalPresentCount,
      fromColor: "#B55CF3",
      toColor: "#D9A6FD",
    },
    {
      label: "Total Absent Count",
      value: classSummary?.totalAbsentCount,
      fromColor: "#F15580",
      toColor: "#F88FB3",
    },
    {
      label: "Average Attendance Rate",
      value: classSummary?.averageAttendanceRate + "%",
      fromColor: "#30C97A",
      toColor: "#8DF4B8",
    },
  ];

  const defaultNavItems: TabListItem[] = [
    { tabLabel: "Attendance Sheet", tabKey: "attendance-sheet" },
    { tabLabel: "Attendance Summary", tabKey: "attendance-summary" },
  ];
  const [activeTabKey, setActiveTabKey] = useState('attendance-sheet');

  const handleItemClick = (item: TabListItem) => {
    setActiveTabKey(item.tabKey);
  };

  return (
    <div className="pb-8">
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-6 px-0.5">
      {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
      ))}
      </section>

      <div>
        <TabBar 
            items={defaultNavItems} 
            activeTabKey={activeTabKey} 
            onItemClick={handleItemClick}
        />

        {activeTabKey === "attendance-sheet" && (
            <div>
                <AttendanceSheetTabSection classId={classId as string} />
            </div>
        )}

        {activeTabKey === "attendance-summary" && (
            <div>
                <AttendanceSummaryTabSection classId={classId as string}/>
            </div>
        )}
      </div>
    </div>
  );
}

export default ClassAttendance
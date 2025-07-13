"use client";
import React, { useState } from 'react'
import StatCard from '@/components/admin/attendence/StatsCard';
import TabBar from '@/components/common/TabBar';
import { AttendanceSheetTabSection } from '@/components/admin/attendence/AttendanceSheetTabSection';
import { AttendanceSummaryTabSection } from '@/components/admin/attendence/AttendanceSummaryTabSection';

export type TabListItem = {
  tabLabel: string;
  tabKey: string;
};

const Attendance = () => {
  const [alreadyDone] = useState(true);
  
  const stats = [
    {
      label: "Total Attendance Count",
      value: "2,347",
      fromColor: "#2B62E5",
      toColor: "#8FB5FF",
    },
    {
      label: "Total Present Count",
      value: "2,347",
      fromColor: "#B55CF3",
      toColor: "#D9A6FD",
    },
    {
      label: "Total Absent Count",
      value: "2,347",
      fromColor: "#F15580",
      toColor: "#F88FB3",
    },
    {
      label: "Average Attendance Rate",
      value: "87%",
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
      {alreadyDone && (
        <>
        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 py-6 px-0.5">
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
            <AttendanceSheetTabSection />
          </div>
        )}

        {activeTabKey === "attendance-summary" && (
          <div>
            <AttendanceSummaryTabSection />
          </div>
        )}
      </div>
      </>
      )}
      
    </div>
  );
}

export default Attendance
"use client";
import React, { useState } from 'react'
import TabBar from '@/components/common/TabBar';
import { AttendanceSheetTabSection } from '@/components/admin/attendence/AttendanceSheetTabSection';
import { AttendanceSummaryTabSection } from '@/components/admin/attendence/AttendanceSummaryTabSection';

export type TabListItem = {
  tabLabel: string;
  tabKey: string;
};

const Attendance = () => {
  

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
    </div>
  );
}

export default Attendance
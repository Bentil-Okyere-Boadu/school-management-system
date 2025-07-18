"use client"
import React, { useState } from 'react'
import { useParams } from 'next/navigation';
import TabBar from '@/components/common/TabBar';
import { AttendanceSheetTabSection } from '@/components/teacher/attendence/AttendanceSheetTabSection';
import { AttendanceSummaryTabSection } from '@/components/teacher/attendence/AttendanceSummaryTabSection';

export type TabListItem = {
  tabLabel: string;
  tabKey: string;
};

const ClassAttendance = () => {

  const { classId } = useParams();

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
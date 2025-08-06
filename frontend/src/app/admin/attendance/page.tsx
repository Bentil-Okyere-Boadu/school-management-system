"use client";
import React, { useState } from 'react'
import TabBar from '@/components/common/TabBar';
import { AttendanceSheetTabSection } from '@/components/admin/attendence/AttendanceSheetTabSection';
import { AttendanceSummaryTabSection } from '@/components/admin/attendence/AttendanceSummaryTabSection';
import { useRouter, useSearchParams } from 'next/navigation';

export type TabListItem = {
  tabLabel: string;
  tabKey: string;
};

const Attendance = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const defaultNavItems: TabListItem[] = [
    { tabLabel: "Attendance Sheet", tabKey: "attendance-sheet" },
    { tabLabel: "Attendance Summary", tabKey: "attendance-summary" },
  ];
  const tabFromUrl = searchParams.get("tab");
  const [activeTabKey, setActiveTabKey] = useState(tabFromUrl || 'attendance-sheet');

  const handleItemClick = (item: TabListItem) => {
    setActiveTabKey(item.tabKey);
    setTabInUrl(item.tabKey);
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
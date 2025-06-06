"use client";
import { AdmissionsAnalyticsTabSection } from '@/components/admin/admissions/AdmissionsAnalyticsTabSection';
import { AdmissionsListTabSection } from '@/components/admin/admissions/AdmissionsListTabSection';
import TabBar from '@/components/common/TabBar';
import React, { useState } from 'react'

export interface MetricCardProps {
  value: string;
  label: string;
  icon: string;
  trend: {
    direction: 'up' | 'down';
    percentage: string;
  };
}

export type TabListItem = {
  tabLabel: string;
  tabKey: string;
};

const Admissions = () => {
  const defaultNavItems: TabListItem[] = [
    { tabLabel: "Admissions Analytics", tabKey: "admissions-analytics" },
    { tabLabel: "Admissions List", tabKey: "admissions-list" },
  ];
  const [activeTabKey, setActiveTabKey] = useState('admissions-analytics');

  const handleItemClick = (item: TabListItem) => {
    setActiveTabKey(item.tabKey);
  };

  return (
    <div>
      <TabBar 
        items={defaultNavItems} 
        activeTabKey={activeTabKey} 
        onItemClick={handleItemClick}
      />

      {activeTabKey === "admissions-analytics" && (
        <div>
          <AdmissionsAnalyticsTabSection  />
        </div>
      )}

      {activeTabKey === "admissions-list" && (
        <div>
          <AdmissionsListTabSection  />
        </div>
      )}
    </div>
  )
}

export default Admissions;
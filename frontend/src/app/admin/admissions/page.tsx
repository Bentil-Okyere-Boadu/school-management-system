"use client";
import { AdmissionsAnalyticsTabSection } from '@/components/admin/admissions/AdmissionsAnalyticsTabSection';
import { AdmissionsListTabSection } from '@/components/admin/admissions/AdmissionsListTabSection';
import CustomButton from '@/components/Button';
import TabBar from '@/components/common/TabBar';
import { useGetSchoolAdminInfo } from '@/hooks/school-admin';
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

  const { schoolAdminInfo } = useGetSchoolAdminInfo();

  const goToAdmissionFormsPage = () => {
    const frontendBaseUrl = process.env.NEXT_PUBLIC_FRONEND_URL;
    const schoolId = schoolAdminInfo?.school?.id;
    const admissionsLink = `${frontendBaseUrl}/admission-forms/${schoolId}`;

    window.open(admissionsLink, "_blank");
  }

  return (
    <div>
      <div className="flex justify-end mb-1">
        <CustomButton text="Get Admission Link" className='!py-1.5' onClick={goToAdmissionFormsPage} />
      </div>
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
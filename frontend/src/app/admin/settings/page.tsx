"use client";
import React, { useState } from "react";
import TabBar from "@/components/common/TabBar";
import { SchoolSettingsTabSection } from "@/components/admin/settings/SchoolSettingsTabSection";
import { ConfigurationTabSection } from "@/components/admin/settings/ConfigurationTabSection";
import { ProfileTabSection } from "@/components/admin/settings/ProfileTabSection";
import { useGetMySchool, useGetSchoolAdminInfo } from "@/hooks/school-admin";

export type TabListItem = {
  tabLabel: string;
  tabKey: string;
};


const AdminSchoolSettings: React.FC = () => {

  const [activeTabKey, setActiveTabKey] = useState('school-settings');
    const { school: schoolData } = useGetMySchool();

  const handleItemClick = (item: TabListItem) => {
    setActiveTabKey(item.tabKey);
  };

  const defaultNavItems: TabListItem[] = [
    { tabLabel: "School Settings", tabKey: "school-settings" },
    { tabLabel: "Configuration", tabKey: "configuration" },
    { tabLabel: "Profile", tabKey: "profile" },
  ];

  const { schoolAdminInfo } = useGetSchoolAdminInfo();

  return (
    <div className="px-0.5">
        <TabBar 
          items={defaultNavItems} 
          activeTabKey={activeTabKey} 
          onItemClick={handleItemClick}
        />
  
        {activeTabKey === "school-settings" && (
          <div>
            <SchoolSettingsTabSection schoolData={schoolData} />
          </div>
        )}

        {activeTabKey === "configuration" && (
          <div>
            <ConfigurationTabSection />
          </div>
        )}

        {activeTabKey === "profile" && (
          <div>
            <ProfileTabSection schoolAdminInfo={schoolAdminInfo} />
          </div>
        )}
    </div>
  )
}

export default AdminSchoolSettings;
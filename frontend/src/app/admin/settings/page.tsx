"use client";
import React, { useState } from "react";
import TabBar from "@/components/common/TabBar";
import { SchoolSettingsTabSection } from "@/components/admin/settings/SchoolSettingsTabSection";
import { ConfigurationTabSection } from "@/components/admin/settings/ConfigurationTabSection";
import { ProfileTabSection } from "@/components/admin/settings/ProfileTabSection";
import { useGetClassLevels, useGetMySchool, useGetSchoolAdminInfo } from "@/hooks/school-admin";
import { useSearchParams, useRouter } from "next/navigation";

export type TabListItem = {
  tabLabel: string;
  tabKey: string;
};


const AdminSchoolSettings: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabFromUrl = searchParams.get("tab");
  const [activeTabKey, setActiveTabKey] = useState(tabFromUrl || 'school-settings');
  const { school: schoolData } = useGetMySchool();
  const { classLevels } = useGetClassLevels();

  const handleItemClick = (item: TabListItem) => {
    setActiveTabKey(item.tabKey);
    setTabInUrl(item.tabKey);
  };

  const setTabInUrl = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
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
            <SchoolSettingsTabSection schoolData={schoolData} classes={classLevels} />
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
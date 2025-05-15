"use client";
import React, { useState } from "react";
import TabBar from "@/components/common/TabBar";
import { SchoolSettingsTabSection } from "@/components/superadmin/schools/SchoolSettingsTabSection";
import { ConfigurationTabSection } from "@/components/superadmin/schools/ConfigurationTabSection";
import { ProfileTabSection } from "@/components/superadmin/schools/ProfileTabSection";
import { useParams } from "next/navigation";
import { useGetSchoolById } from "@/hooks/users";

export type TabListItem = {
  tabLabel: string;
  tabKey: string;
};


const SingleSchoolPage: React.FC = () => {
  const params = useParams();
  const schoolId = params.id;

  const { school } = useGetSchoolById(schoolId as string);

  const [activeTabKey, setActiveTabKey] = useState('school-settings');

  const handleItemClick = (item: TabListItem) => {
    setActiveTabKey(item.tabKey);
  };

  const defaultNavItems: TabListItem[] = [
    { tabLabel: "School Settings", tabKey: "school-settings" },
    { tabLabel: "Configuration", tabKey: "configuration" },
    { tabLabel: "Profile", tabKey: "profile" },
  ];


  return (
    <div className="px-0.5">
        <TabBar 
          items={defaultNavItems} 
          activeTabKey={activeTabKey} 
          onItemClick={handleItemClick} // triggered from the child, it will in return trigger handleItemClick function
        />
  
        {activeTabKey === "school-settings" && (
          <div>
            <SchoolSettingsTabSection schoolData={school} />
          </div>
        )}

        {activeTabKey === "configuration" && (
          <div>
            <ConfigurationTabSection />
          </div>
        )}

        {activeTabKey === "profile" && (
          <div>
            <ProfileTabSection schoolData={school} />
          </div>
        )}


    </div>
  );
};

export default SingleSchoolPage;
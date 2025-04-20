"use client";
import React, { useState } from "react";
import NavigationBar from "@/components/admin/NavigationBar";
import { SchoolSettingsTabSection } from "@/components/admin/schools/SchoolSettingsTabSection";
import { ConfigurationTabSection } from "@/components/admin/schools/ConfigurationTabSection";
import { ProfileTabSection } from "@/components/admin/schools/ProfileTabSection";

export type NavItem = {
  tabLabel: string;
  tabKey: string;
};


const SingleSchoolPage: React.FC = () => {

  const [activeTabKey, setActiveTabKey] = useState('school-settings');

  const handleItemClick = (item: NavItem) => {
    setActiveTabKey(item.tabKey);
  };

  const defaultNavItems: NavItem[] = [
    { tabLabel: "School Settings", tabKey: "school-settings" },
    { tabLabel: "Configuration", tabKey: "configuration" },
    { tabLabel: "Profile", tabKey: "profile" },
  ];


  return (
    <div className="px-0.5">
        <NavigationBar 
          items={defaultNavItems} 
          activeTabKey={activeTabKey} 
          onItemClick={handleItemClick} // triggered from the child, it will in return trigger handleItemClick function
        />
  
        {activeTabKey === "school-settings" && (
          <div>
            <SchoolSettingsTabSection />
          </div>
        )}

        {activeTabKey === "configuration" && (
          <div>
            <ConfigurationTabSection />
          </div>
        )}

        {activeTabKey === "profile" && (
          <div>
            <ProfileTabSection />
          </div>
        )}


    </div>
  );
};

export default SingleSchoolPage;
"use client";
import React, { useState } from "react";
import TabBar from "@/components/common/TabBar";
import { SchoolSettingsTabSection } from "@/components/superadmin/schools/SchoolSettingsTabSection";
import { ConfigurationTabSection } from "@/components/superadmin/schools/ConfigurationTabSection";
import { ProfileTabSection } from "@/components/superadmin/schools/ProfileTabSection";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useGetSchoolById } from "@/hooks/super-admin";
import SchoolPeople from "@/components/superadmin/schools/SchoolPeople";
import { Calendar } from "@/@types";

export type TabListItem = {
  tabLabel: string;
  tabKey: string;
};


const SingleSchoolPage: React.FC = () => {
  const params = useParams();
  const schoolId = params.id;
  const searchParams = useSearchParams();
  const router = useRouter();

  const { school } = useGetSchoolById(schoolId as string);

  const tabFromUrl = searchParams.get("tab");
  const [activeTabKey, setActiveTabKey] = useState(tabFromUrl || 'school-settings');

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
    { tabLabel: "People", tabKey: "people" },
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
            <ConfigurationTabSection calendars={school?.academicCalendars as Calendar[] || []} />
          </div>
        )}

        {activeTabKey === "profile" && (
          <div>
            <ProfileTabSection schoolData={school} />
          </div>
        )}
        
        {activeTabKey === "people" && (
          <div>
            <SchoolPeople users={school?.users}/>
          </div>
        )}


    </div>
  );
};

export default SingleSchoolPage;
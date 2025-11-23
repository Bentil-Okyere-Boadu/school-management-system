"use client"
import React, { useState } from "react";
import TabBar, { TabListItem } from "@/components/common/TabBar";
import { useSearchParams, useRouter } from "next/navigation";
import { MySubjectsTabSection } from "@/components/teacher/subjects/MySubjectsTabSection";
import { TopicsTabSection } from "@/components/teacher/subjects/TopicsTabSection";
import { TopicAssignmentsTabSection } from "@/components/teacher/subjects/TopicAssignmentsTabSection";

const TeacherSubjectsPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabFromUrl = searchParams.get("tab");
  const [activeTabKey, setActiveTabKey] = useState(tabFromUrl || "my-subjects");

  const defaultNavItems: TabListItem[] = [
    { tabLabel: "My Subjects", tabKey: "my-subjects" },
    { tabLabel: "Topics", tabKey: "topics" },
    { tabLabel: "Assignments", tabKey: "topic-assignment" },
  ];

  const setTabInUrl = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  };

  const handleItemClick = (item: TabListItem) => {
    setActiveTabKey(item.tabKey);
    setTabInUrl(item.tabKey);
  };

  return (
    <div className="px-0.5">
      <TabBar
        items={defaultNavItems}
        activeTabKey={activeTabKey}
        onItemClick={handleItemClick}
      />
      
      {activeTabKey === "my-subjects" && (
        <div>
          <MySubjectsTabSection />
        </div>
      )}
      {activeTabKey === "topics" && (
        <div>
          <TopicsTabSection />
        </div>
      )}
      {activeTabKey === "topic-assignment" && (
        <div>
          <TopicAssignmentsTabSection />
        </div>
      )}
    </div>
  );
};

export default TeacherSubjectsPage;


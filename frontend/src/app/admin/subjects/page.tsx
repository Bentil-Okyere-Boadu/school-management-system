"use client"
import React, { useState } from "react";
import { TabListItem } from "../admissions/page";
import TabBar from "@/components/common/TabBar";
import Subjects from "@/components/admin/subjects/Subjects";
import SubjectAssignment from "@/components/admin/subjects/SubjectAssignment";
import { useSearchParams, useRouter } from "next/navigation";
import { CurriculumTabSection } from "@/components/admin/subjects/CurriculumTabSection";
import { TopicsTabSection } from "@/components/admin/subjects/TopicsTabSection";

const SubjectsPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabFromUrl = searchParams.get("tab");
  const [activeTabKey, setActiveTabKey] = useState(tabFromUrl || "subjects");

  const defaultNavItems: TabListItem[] = [
    { tabLabel: "Subjects", tabKey: "subjects" },
    { tabLabel: "Subjects Assignment", tabKey: "assign-subjects" },
    { tabLabel: "Curriculum", tabKey: "curriculum" },
    { tabLabel: "Topics", tabKey: "topics" },
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

      {activeTabKey === "subjects" && (
        <div>
            <Subjects/>
        </div>
        )}
      {activeTabKey === "assign-subjects" && (
        <div>
            <SubjectAssignment/>
        </div>
        )}
      {activeTabKey === "curriculum" && (
        <div>
            <CurriculumTabSection/>
        </div>
        )}
      {activeTabKey === "topics" && (
        <div>
            <TopicsTabSection/>
        </div>
        )}
    </div>
  );
};

export default SubjectsPage;

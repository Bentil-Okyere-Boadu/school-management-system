"use client"
import React, { useState } from "react";
import { TabListItem } from "../admissions/page";
import TabBar from "@/components/common/TabBar";
import Subjects from "@/components/admin/subjects/Subjects";
import SubjectAssignment from "@/components/admin/subjects/SubjectAssignment";

const SubjectsPage = () => {
  const [activeTabKey, setActiveTabKey] = useState("subjects");

  const defaultNavItems: TabListItem[] = [
    { tabLabel: "Subjects", tabKey: "subjects" },
    { tabLabel: "Subjects Assignment", tabKey: "assign-subjects" },
  ];

  const handleItemClick = (item: TabListItem) => {
    setActiveTabKey(item.tabKey);
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
    </div>
  );
};

export default SubjectsPage;

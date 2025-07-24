import React, { useState } from "react";
import { TabListItem } from "../admissions/page";
import TabBar from "@/components/common/TabBar";

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

      {activeTabKey === "subjects" && <div></div>}
      {activeTabKey === "assign-subjects" && <div></div>}
    </div>
  );
};

export default SubjectsPage;

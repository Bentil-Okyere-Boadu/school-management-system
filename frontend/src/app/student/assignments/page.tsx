"use client";
import React, { useState, useEffect, useCallback } from "react";
import TabBar, { TabListItem } from "@/components/common/TabBar";
import { useSearchParams, useRouter } from "next/navigation";
import { PendingAssignmentsTab } from "@/components/student/assignments/PendingAssignmentsTab";
import { SubmittedAssignmentsTab } from "@/components/student/assignments/SubmittedAssignmentsTab";
import { GradedAssignmentsTab } from "@/components/student/assignments/GradedAssignmentsTab";
import { useGetStudentAssignments } from "@/hooks/student";

const StudentAssignmentsPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabFromUrl = searchParams.get("tab");
  const [activeTabKey, setActiveTabKey] = useState(tabFromUrl || "pending");

  const { assignments: pendingAssignments } = useGetStudentAssignments("pending");
  const { assignments: submittedAssignments } = useGetStudentAssignments("submitted");
  const { assignments: gradedAssignments } = useGetStudentAssignments("graded");

  const defaultNavItems: TabListItem[] = [
    { tabLabel: `Pending (${pendingAssignments?.length || 0})`, tabKey: "pending" },
    { tabLabel: `Submitted (${submittedAssignments?.length || 0})`, tabKey: "submitted" },
    { tabLabel: `Graded (${gradedAssignments?.length || 0})`, tabKey: "graded" },
  ];

  const setTabInUrl = useCallback((tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  useEffect(() => {
    if (tabFromUrl && ["pending", "submitted", "graded"].includes(tabFromUrl)) {
      setActiveTabKey(tabFromUrl);
    } else if (!tabFromUrl) {
      // If no tab in URL, set default and update URL
      setTabInUrl("pending");
    }
  }, [tabFromUrl, setTabInUrl]);

  const handleItemClick = (item: TabListItem) => {
    setActiveTabKey(item.tabKey);
    setTabInUrl(item.tabKey);
  };

  return (
    <div className="px-0.5">
      <h1 className="text-2xl font-semibold text-neutral-800 mb-6">Assignments</h1>
      <TabBar
        items={defaultNavItems}
        activeTabKey={activeTabKey}
        onItemClick={handleItemClick}
      />
      
      {activeTabKey === "pending" && (
        <div>
          <PendingAssignmentsTab />
        </div>
      )}
      {activeTabKey === "submitted" && (
        <div>
          <SubmittedAssignmentsTab />
        </div>
      )}
      {activeTabKey === "graded" && (
        <div>
          <GradedAssignmentsTab />
        </div>
      )}
    </div>
  );
};

export default StudentAssignmentsPage;


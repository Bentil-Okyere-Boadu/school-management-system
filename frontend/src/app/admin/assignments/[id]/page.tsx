"use client";
import React, { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import TabBar from "@/components/common/TabBar";
import { useGetAssignmentStudents } from "@/hooks/school-admin";
import PendingAssignmentStudentsTable from "@/components/admin/assignments/PendingAssignmentStudentsTable";
import SubmittedAssignmentStudentsTable from "@/components/admin/assignments/SubmittedAssignmentStudentsTable";
import { IconArrowLeft } from "@tabler/icons-react";

export type TabListItem = {
  tabLabel: string;
  tabKey: string;
};

const AssignmentDetailPage = () => {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tabFromUrl = searchParams.get("tab") || "submitted";
  const [activeTabKey, setActiveTabKey] = useState(tabFromUrl);

  // Fetch counts for both tabs (always enabled to show counts in tab labels)
  const { students: pendingStudents, isLoading: isLoadingPending } = useGetAssignmentStudents(
    id as string,
    "pending"
  );

  const { students: submittedStudents, isLoading: isLoadingSubmitted } = useGetAssignmentStudents(
    id as string,
    "submitted"
  );

  const handleItemClick = (item: TabListItem) => {
    const tabKey = item.tabKey as "submitted" | "pending";
    setActiveTabKey(tabKey);
    setTabInUrl(tabKey);
  };

  const setTabInUrl = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  };

  const defaultNavItems: TabListItem[] = [
    { 
      tabLabel: `Submitted (${submittedStudents?.length || 0})`, 
      tabKey: "submitted" 
    },
    { 
      tabLabel: `Pending (${pendingStudents?.length || 0})`, 
      tabKey: "pending" 
    },
  ];

  return (
    <div className="px-0.5">
      <button 
        onClick={() => router.push('/admin/assignments')}
        className="flex items-center gap-2 text-purple-600 hover:text-purple-800 cursor-pointer mb-6 transition-colors font-extrabold"
      >
        <IconArrowLeft size={20} />
        <span>Back to Assignments</span>
      </button>
      
      <TabBar 
        items={defaultNavItems} 
        activeTabKey={activeTabKey} 
        onItemClick={handleItemClick}
      />

      {activeTabKey === "pending" && (
        <div>
          <PendingAssignmentStudentsTable 
            students={pendingStudents || []} 
            isLoading={isLoadingPending}
          />
        </div>
      )}

      {activeTabKey === "submitted" && (
        <div>
          <SubmittedAssignmentStudentsTable 
            students={submittedStudents || []} 
            isLoading={isLoadingSubmitted}
          />
        </div>
      )}
    </div>
  );
};

export default AssignmentDetailPage;


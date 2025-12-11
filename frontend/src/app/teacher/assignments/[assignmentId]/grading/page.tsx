"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import TabBar, { TabListItem } from "@/components/common/TabBar";
import { SubmittedTab } from "@/components/teacher/assignments/SubmittedTab";
import { PendingTab } from "@/components/teacher/assignments/PendingTab";
import { useGetTeacherAssignments, useGetAssignmentSubmittedStudents, useGetAssignmentPendingStudents } from "@/hooks/teacher";
import { HashLoader } from "react-spinners";
import { IconArrowLeft } from "@tabler/icons-react";

const AssignmentGradingPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = params.assignmentId as string;
  const tabFromUrl = searchParams.get("tab");
  const [activeTabKey, setActiveTabKey] = useState(tabFromUrl || "submitted");

  const { teacherAssignments, isLoading } = useGetTeacherAssignments("");
  const assignment = teacherAssignments?.find((a: { id: string }) => a.id === assignmentId);

  const { submittedStudents } = useGetAssignmentSubmittedStudents(assignmentId);
  const { pendingStudents } = useGetAssignmentPendingStudents(assignmentId);

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

  const setTabInUrl = useCallback((tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  useEffect(() => {
    if (tabFromUrl && ["submitted", "pending"].includes(tabFromUrl)) {
      setActiveTabKey(tabFromUrl);
    } else if (!tabFromUrl) {
      setTabInUrl("submitted");
    }
  }, [tabFromUrl, setTabInUrl]);

  const handleItemClick = (item: TabListItem) => {
    setActiveTabKey(item.tabKey);
    setTabInUrl(item.tabKey);
  };
  

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <HashLoader color="#AB58E7" size={40} />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
        <p className="text-lg font-medium">Assignment not found</p>
      </div>
    );
  }

  return (
    <div className="px-0.5">
      <button 
        onClick={() => router.push('/teacher/subjects?tab=topic-assignment')}
        className="flex items-center gap-2 text-purple-600 hover:text-purple-800 cursor-pointer mb-6 transition-colors font-extrabold"
      >
        <IconArrowLeft size={20} />
        <span>Back to Assignments</span>
      </button>
      
      <h1 className="text-2xl font-semibold text-neutral-800 my-4">{assignment.title}</h1>
      <TabBar
        items={defaultNavItems}
        activeTabKey={activeTabKey}
        onItemClick={handleItemClick}
      />
      

      {activeTabKey === "submitted" && (
        <div>
          <SubmittedTab assignmentId={assignmentId} maxScore={assignment.maxScore} assignmentType={assignment.assignmentType} />
        </div>
      )}
      {activeTabKey === "pending" && (
        <div>
          <PendingTab assignmentId={assignmentId} assignmentType={assignment.assignmentType} />
        </div>
      )}
    </div>
  );
};

export default AssignmentGradingPage;


"use client";
import React from "react";
import { AssignmentSubmission } from "@/@types";
import { useGetAssignmentPendingStudents } from "@/hooks/teacher";
import { HashLoader } from "react-spinners";

interface PendingTabProps {
  assignmentId: string;
  assignmentType?: "online" | "offline";
}

export const PendingTab: React.FC<PendingTabProps> = ({ assignmentId, assignmentType }) => {
  const { pendingStudents, isLoading } = useGetAssignmentPendingStudents(assignmentId);

  return (
    <section className="bg-white mt-2">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                <div>Student Name</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                <div>Student ID</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                  <div>Type</div>
                </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                <div>Status</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              if (isLoading) {
                return (
                  <tr>
                    <td colSpan={4}>
                      <div className="relative py-20 bg-white">
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 backdrop-blur-sm">
                          <HashLoader color="#AB58E7" size={40} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              }

              if (!pendingStudents?.length) {
                return (
                  <tr>
                    <td colSpan={4}>
                      <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                        <p className="text-lg font-medium">No pending assignments</p>
                        <p className="text-sm text-gray-400 mt-1">
                          All students have submitted their assignments.
                        </p>
                      </div>
                    </td>
                  </tr>
                );
              }

              return pendingStudents.map((student: AssignmentSubmission) => {
                const isArchived = student.isArchived || false;
                return (
                  <tr key={student.id} className={isArchived ? "bg-gray-50" : ""}>
                    <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      <div className="flex items-center gap-2">
                        <span>{`${student.firstName} ${student.lastName}`}</span>
                        {isArchived && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                            Archived
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      <div>{student.studentId || "-"}</div>
                    </td>
                    <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (assignmentType || "online") === "online"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {(assignmentType || "online") === "online" ? "Online" : "Offline"}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isArchived 
                          ? "bg-gray-200 text-gray-600 cursor-not-allowed" 
                          : "bg-purple-200 text-purple-700"
                      }`} title={isArchived ? "Archived students cannot submit assignments" : ""}>
                        {isArchived ? "Cannot Submit" : "Not Submitted"}
                      </span>
                    </td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
    </section>
  );
};


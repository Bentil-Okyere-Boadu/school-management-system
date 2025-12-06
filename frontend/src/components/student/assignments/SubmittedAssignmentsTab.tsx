"use client";
import React from "react";
import { StudentAssignment } from "@/@types";
import { useGetStudentAssignments } from "@/hooks/student";
import { HashLoader } from "react-spinners";

export const SubmittedAssignmentsTab: React.FC = () => {
  const { assignments, isLoading } = useGetStudentAssignments("submitted");

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <section className="bg-white mt-2">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                <div>Assignment</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                <div>Subject</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                <div>Topic</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                <div>Teacher</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                <div>Submitted</div>
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
                    <td colSpan={7}>
                      <div className="relative py-20 bg-white">
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 backdrop-blur-sm">
                          <HashLoader color="#AB58E7" size={40} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              }

              if (!assignments?.length) {
                return (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                        <p className="text-lg font-medium">No submitted assignments</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Submitted assignments will appear here.
                        </p>
                      </div>
                    </td>
                  </tr>
                );
              }

              return assignments.map((assignment: StudentAssignment) => (
                <tr key={assignment.id}>
                  <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                    <div className="flex gap-2">
                      <div className="flex justify-center">
                        {assignment.attachmentPath && (
                          <a 
                            href={assignment.attachmentUrl || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors duration-200"
                            title="View attachment"
                          >
                            <svg 
                              className="w-4 h-4 text-blue-600" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" 
                              />
                            </svg>
                          </a>
                        )}
                      </div>
                      {assignment.assignment}
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                    <div>{assignment.subject}</div>
                  </td>
                  <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                    <div>{assignment.topic || "-"}</div>
                  </td>
                  <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                    <div>{assignment.teacher}</div>
                  </td>
                  <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                    <div>{assignment.submittedAt ? formatDate(assignment.submittedAt) : "-"}</div>
                  </td>
                  <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-200 text-blue-700">
                      Submitted
                    </span>
                  </td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>
    </section>
  );
};


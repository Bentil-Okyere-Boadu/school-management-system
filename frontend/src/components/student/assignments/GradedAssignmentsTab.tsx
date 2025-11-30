"use client";
import React from "react";
import CustomButton from "@/components/Button";
import { StudentAssignment } from "@/@types";
import { useGetStudentAssignments } from "@/hooks/student";
import { HashLoader } from "react-spinners";

export const GradedAssignmentsTab: React.FC = () => {
  const { assignments, isLoading } = useGetStudentAssignments("graded");

  const handleViewFeedbackClick = (assignment: StudentAssignment) => {
    // TODO: Implement view feedback functionality
    console.log("View feedback for assignment:", assignment);
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
                <div>Teacher</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                <div>Score</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                <div>Status</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                <div>Actions</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              if (isLoading) {
                return (
                  <tr>
                    <td colSpan={6}>
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
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                        <p className="text-lg font-medium">No graded assignments</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Graded assignments will appear here.
                        </p>
                      </div>
                    </td>
                  </tr>
                );
              }

              return assignments.map((assignment: StudentAssignment) => (
                <tr key={assignment.id}>
                  <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                    <div>{assignment.assignment}</div>
                  </td>
                  <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                    <div>{assignment.subject}</div>
                  </td>
                  <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                    <div>{assignment.teacher}</div>
                  </td>
                  <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                    <div className="text-purple-600 font-medium">
                      {assignment.score !== undefined && assignment.maxScore !== undefined
                        ? `${assignment.score}/${assignment.maxScore}`
                        : "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-200 text-green-700">
                      Graded
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                    <CustomButton
                      text="View Feedback"
                      onClick={() => handleViewFeedbackClick(assignment)}
                      className="bg-purple-500 hover:bg-purple-600 text-white"
                    />
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


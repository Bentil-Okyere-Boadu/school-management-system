"use client";
import { AssignmentSubmission } from "@/@types";
import { HashLoader } from "react-spinners";
import React from "react";

interface PendingAssignmentStudentsTableProps {
  students: AssignmentSubmission[];
  isLoading?: boolean;
}

const PendingAssignmentStudentsTable = ({ 
  students, 
  isLoading
}: PendingAssignmentStudentsTableProps) => {
  return (
    <section className="bg-white rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-[200px]">
                <div>Student Name</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-center max-md:px-5 min-w-[120px]">
                <div>Student ID</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-[200px]">
                <div>Email</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-right max-md:px-5 min-w-[120px]">
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
                      <div className="relative py-16">
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl z-10">
                          <HashLoader color="#AB58E7" size={40} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              }

              if (!students?.length) {
                return (
                  <tr>
                    <td colSpan={4}>
                      <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                        <p className="text-lg font-medium">
                          No pending students found
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Students who haven&apos;t submitted will appear here.
                        </p>
                      </div>
                    </td>
                  </tr>
                );
              }

              return students.map((student: AssignmentSubmission) => {
                const isArchived = student.isArchived || false;
                return (
                  <tr key={student.id} className={`hover:bg-gray-50 ${isArchived ? "bg-gray-50" : ""}`}>
                    <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-800">
                          {student.firstName} {student.lastName}
                        </span>
                        {isArchived && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                            Archived
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="text-sm px-6 py-4 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 text-center max-md:px-5">
                      {student.studentId}
                    </td>

                    <td className="text-sm px-6 py-4 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                      {student.email}
                    </td>

                    <td className="text-sm px-6 py-4 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      <div className="flex justify-end">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isArchived 
                            ? "bg-gray-200 text-gray-600 cursor-not-allowed" 
                            : "bg-orange-100 text-orange-700"
                        }`} title={isArchived ? "Archived students cannot submit assignments" : ""}>
                          {isArchived ? "Cannot Submit" : "Not Submitted"}
                        </span>
                      </div>
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

export default PendingAssignmentStudentsTable;
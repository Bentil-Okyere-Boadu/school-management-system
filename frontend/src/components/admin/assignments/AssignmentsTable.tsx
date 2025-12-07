"use client";
import { AdminAssignment } from "@/@types";
import { Menu } from "@mantine/core";
import { IconDots, IconEyeFilled } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import React from "react";
import { HashLoader } from "react-spinners";

interface AssignmentsTableProps {
  assignments: AdminAssignment[];
  refetch?: () => void;
  busy?: boolean;
}

const AssignmentsTable = ({ assignments, busy }: AssignmentsTableProps) => {
  const router = useRouter();
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (state: string) => {
    const isPublished = state === "published";
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          isPublished
            ? "bg-purple-100 text-purple-700"
            : "bg-gray-100 text-gray-700"
        }`}
      >
        {state === "published" ? "Published" : "Draft"}
      </span>
    );
  };

  return (
    <section className="bg-white rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-[200px]">
                <div>Assignment</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-[120px]">
                <div>Subject</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-[150px]">
                <div>Teacher</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-[120px]">
                <div>Class</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-[100px]">
                <div>Due Date</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-[100px]">
                <div>Status</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-[100px]">
                <div>Submissions</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-[100px]">
                <div>Max Score</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-[50px]"></th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              if (busy) {
                return (
                  <tr>
                    <td colSpan={9}>
                      <div className="relative py-16">
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl z-10">
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
                    <td colSpan={9}>
                      <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                        <p className="text-lg font-medium">No assignments found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Once assignments are created, they will appear in this table.
                        </p>
                      </div>
                    </td>
                  </tr>
                );
              }

              return assignments.map((assignment: AdminAssignment) => (
                <tr key={assignment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-zinc-800">
                        {assignment.title}
                      </span>
                      {assignment.topic?.name && (
                        <span className="text-xs text-gray-500 mt-1">
                          {assignment.topic.name}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="text-sm px-6 py-4 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    {assignment.subject?.name || "-"}
                  </td>

                  <td className="text-sm px-6 py-4 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    {assignment.teacher
                      ? `${assignment.teacher.firstName} ${assignment.teacher.lastName}`
                      : "-"}
                  </td>

                  <td className="text-sm px-6 py-4 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    {assignment.classLevel?.name || "-"}
                  </td>

                  <td className="text-sm px-6 py-4 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    {formatDate(assignment.dueDate)}
                  </td>

                  <td className="text-sm px-6 py-4 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                    {getStatusBadge(assignment.state)}
                  </td>

                  <td className="text-sm px-6 py-4 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    {assignment.submissions || 0}
                  </td>

                  <td className="text-sm px-6 py-4 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    {assignment.maxScore}
                  </td>

                  <td className="text-sm px-6 py-4 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    <div className="flex items-center justify-end pr-6">
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <IconDots className="cursor-pointer" />
                        </Menu.Target>
                        <Menu.Dropdown className="!-ml-12 !-mt-2">
                          <Menu.Item
                            leftSection={<IconEyeFilled size={18} color="#AB58E7" />}
                            onClick={() => {
                              router.push(`/admin/assignments/${assignment.id}`);
                            }}
                          >
                            View Details
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </div>
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

export default AssignmentsTable;


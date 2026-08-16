"use client";

import React from "react";
import { Menu } from "@mantine/core";
import {
  IconDots,
  IconEyeFilled,
  IconMail,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Student } from "@/@types";

interface ClassEnrolledStudentsTableProps {
  students: Student[];
  isRemoveMode?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  profileBasePath?: string;
}

export const ClassEnrolledStudentsTable: React.FC<
  ClassEnrolledStudentsTableProps
> = ({
  students,
  isRemoveMode = false,
  selectedIds = [],
  onSelectionChange,
  profileBasePath = "/admin/students",
}) => {
  const router = useRouter();

  const toggleStudent = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (selectedIds.length === students.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(students.map((s) => s.id));
    }
  };

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-500">
        No students enrolled in this class yet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-[#F9F5FF]">
              {isRemoveMode && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={
                      students.length > 0 &&
                      students.every((s) => selectedIds.includes(s.id))
                    }
                    onChange={toggleAll}
                    className="accent-purple-600"
                  />
                </th>
              )}
              <th className="px-6 py-3 text-xs font-semibold text-[#7C3AED] text-left">
                ID
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-[#7C3AED] text-left">
                Name
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-[#7C3AED] text-left">
                Email
              </th>
              {!isRemoveMode && <th className="px-4 py-3 w-10" />}
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                className="border-b border-gray-100 last:border-b-0"
              >
                {isRemoveMode && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                      className="accent-purple-600"
                    />
                  </td>
                )}
                <td className="px-6 py-3 text-sm text-gray-500">
                  {student.studentId ?? "—"}
                </td>
                <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                  {student.firstName} {student.lastName}
                </td>
                <td className="px-6 py-3 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <IconMail size={14} className="shrink-0" />
                    {student.email}
                  </span>
                </td>
                {!isRemoveMode && (
                  <td className="px-4 py-3">
                    <Menu shadow="md" width={160} position="bottom-end">
                      <Menu.Target>
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-gray-100 cursor-pointer"
                          aria-label="Student actions"
                        >
                          <IconDots size={18} className="text-gray-500" />
                        </button>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEyeFilled size={14} />}
                          onClick={() =>
                            router.push(`${profileBasePath}/${student.id}`)
                          }
                        >
                          View profile
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClassEnrolledStudentsTable;

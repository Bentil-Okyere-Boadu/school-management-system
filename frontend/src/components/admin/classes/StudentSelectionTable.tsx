"use client";
import React, { useMemo } from "react";
import { SearchBar } from "@/components/common/SearchBar";

interface Student {
  id: string;
  studentId?: string;
  firstName: string;
  lastName: string;
  email: string;
  isArchived?: boolean;
}

interface Props {
  students: Student[];
  selectedStudents: string[];
  onChange: (selected: string[]) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  useFullWidthSearch?: boolean;
}

const StudentSelectionTable = ({
  students,
  selectedStudents,
  onChange,
  searchQuery = "",
  onSearchChange,
  useFullWidthSearch = false,
}: Props) => {
  const toggleStudent = (id: string) => {
    if (selectedStudents.includes(id)) {
      onChange(selectedStudents.filter((sid) => sid !== id));
    } else {
      onChange([...selectedStudents, id]);
    }
  };

  const toggleAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      onChange([]);
    } else {
      onChange(filteredStudents.map((s) => s.id));
    }
  };

  const filteredStudents = useMemo(() => {
    if (onSearchChange) {
      return students;
    }
    const term = searchQuery.toLowerCase();
    return students.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      return (
        fullName.includes(term) ||
        student.email.toLowerCase().includes(term) ||
        (student.studentId ?? "").toLowerCase().includes(term)
      );
    });
  }, [students, searchQuery, onSearchChange]);

  return (
    <section>
      <div className="mb-3">
        {useFullWidthSearch && onSearchChange ? (
          <SearchBar
            placeholder="Search student by name, email, or ID"
            className="w-full"
            value={searchQuery}
            onSearch={onSearchChange}
          />
        ) : (
          <input
            type="text"
            placeholder="Search student by name, email, or ID"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full px-3 py-2 !text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        )}
      </div>

      <div className="overflow-y-auto max-h-[400px]">
        <table className="w-full border-collapse min-w-[500px]">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="bg-gray-50">
              <th className="px-4 py-1.5 text-left bg-gray-50 w-10">
                <input
                  type="checkbox"
                  checked={
                    filteredStudents.length > 0 &&
                    filteredStudents.every((s) =>
                      selectedStudents.includes(s.id)
                    )
                  }
                  onChange={toggleAll}
                  className="accent-purple-600"
                />
              </th>
              <th className="px-4 py-1.5 text-left text-xs font-medium text-gray-500">
                Name
              </th>
              <th className="px-4 py-1.5 text-left text-xs font-medium text-gray-500">
                ID
              </th>
              <th className="px-4 py-1.5 text-left text-xs font-medium text-gray-500">
                Email
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-gray-200 text-sm">
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                      className="accent-purple-600"
                    />
                  </td>
                  <td className="px-4 py-2 font-medium">
                    {student.firstName} {student.lastName}
                    {student.isArchived && (
                      <span className="ml-2 text-xs text-gray-500 italic">
                        (archived)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {student.studentId ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-500">{student.email}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-500">
                  No students match your search
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default StudentSelectionTable;

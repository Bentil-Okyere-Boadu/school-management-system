"use client";
import React, { useState, useMemo } from "react";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isArchived?: boolean;
}

interface Props {
  students: Student[];
  selectedStudents: string[];
  onChange: (selected: string[]) => void;
}

const StudentSelectionTable = ({ students, selectedStudents, onChange }: Props) => {
  const [searchTerm, setSearchTerm] = useState("");

  const toggleStudent = (id: string) => {
    if (selectedStudents.includes(id)) {
      onChange(selectedStudents.filter(sid => sid !== id));
    } else {
      onChange([...selectedStudents, id]);
    }
  };

  const toggleAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      onChange([]);
    } else {
      onChange(filteredStudents.map(s => s.id));
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      return (
        fullName.includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [searchTerm, students]);

  return (
<section>
  <div className="mb-2">
    <input
      type="text"
      placeholder="Search student by name or email"
      value={searchTerm}
      onChange={handleSearch}
      className="w-1/2 px-2 py-2 !text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
    />
  </div>

  {/* Scrollable wrapper with full table inside */}
  <div className="overflow-y-auto max-h-[400px]">
    <table className="w-full border-collapse min-w-[500px]">
      <thead className="sticky top-0 bg-white z-10">
        <tr className="bg-gray-50">
          <th className="px-6 py-1.5 text-left bg-gray-50">
            <input
              type="checkbox"
              checked={
                filteredStudents.length > 0 &&
                filteredStudents.every((s) => selectedStudents.includes(s.id))
              }
              onChange={toggleAll}
            />
          </th>
          <th className="px-6 py-1.5 text-left text-xs font-medium text-gray-500">Name</th>
          <th className="px-6 py-1.5 text-left text-xs font-medium text-gray-500">Email</th>
        </tr>
      </thead>
      <tbody>
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <tr key={student.id} className="border-b border-gray-200 text-sm">
              <td className="px-6 py-2">
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student.id)}
                  onChange={() => toggleStudent(student.id)}
                />
              </td>
              <td className="px-6 py-2">
                {student.firstName} {student.lastName}
                {student.isArchived && (
                  <span className="ml-2 text-xs text-gray-500 italic">(archived)</span>
                )}
              </td>
              <td className="px-6 py-2">{student.email}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={3} className="text-center py-6 text-gray-500">
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

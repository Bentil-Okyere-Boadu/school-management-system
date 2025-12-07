"use client";
import { User } from "@/@types";
import AssignmentsTable from "@/components/admin/assignments/AssignmentsTable";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import { Pagination } from "@/components/common/Pagination";
import { SearchBar } from "@/components/common/SearchBar";
import { useDebouncer } from "@/hooks/generalHooks";
import { useGetAssignments, useGetClassLevels, useGetSchoolUsers } from "@/hooks/school-admin";
import React, { useState, useMemo } from "react";

const Assignments = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  const { classLevels } = useGetClassLevels();
  const { schoolUsers: schoolTeachers } = useGetSchoolUsers(
    currentPage,
    "",
    "",
    "",
    "Teacher",
    500
  );

  const teacherOptions = useMemo(() => {
    const options = [
      { value: "", label: "All Teachers" },
      ...(schoolTeachers?.map((teacher: User) => ({
        value: teacher.id,
        label: `${teacher.firstName} ${teacher.lastName}`,
      })) || []),
    ];
    return options;
  }, [schoolTeachers]);

  const classOptions = useMemo(() => {
    const options = [
      { value: "", label: "All Classes" },
      ...(classLevels?.map((classLevel) => ({
        value: classLevel.id,
        label: classLevel.name,
      })) || []),
    ];
    return options;
  }, [classLevels]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleTeacherChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeacher(event.target.value);
    setCurrentPage(1);
  };

  const handleClassChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClass(event.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const { assignments, isLoading, paginationValues, refetch } = useGetAssignments(
    currentPage,
    useDebouncer(searchQuery),
    selectedTeacher,
    selectedClass
  );

  return (
    <div>
      <div className="flex justify-between items-center flex-wrap gap-4 w-full mb-5 px-0.5">
        <div className="flex gap-2">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search assignments..."
            className="w-[366px] max-md:w-full"
          />
          <CustomSelectTag
            selectClassName="py-2.5"
            value={selectedTeacher}
            options={teacherOptions}
            onOptionItemClick={handleTeacherChange}
          />
          <CustomSelectTag
            selectClassName="py-2.5"
            value={selectedClass}
            options={classOptions}
            onOptionItemClick={handleClassChange}
          />
        </div>
      </div>
      <AssignmentsTable assignments={assignments} refetch={refetch} busy={isLoading} />
      <Pagination
        currentPage={currentPage}
        totalPages={paginationValues?.totalPages || 1}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default Assignments;


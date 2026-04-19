"use client";
import { CurriculumRecord, User } from "@/@types";
import AssignmentsTable from "@/components/admin/assignments/AssignmentsTable";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import { TermFilterCard } from "@/components/common/TermFilterCard";
import { Pagination } from "@/components/common/Pagination";
import { SearchBar } from "@/components/common/SearchBar";
import { useDebouncer } from "@/hooks/generalHooks";
import {
  useGetAssignments,
  useGetCalendars,
  useGetClassLevels,
  useGetCurricula,
  useGetSchoolUsers,
} from "@/hooks/school-admin";
import { getSortedSchoolTerms } from "@/utils/schoolTerms";
import React, { useState, useMemo } from "react";

const Assignments = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [selectedCurriculumId, setSelectedCurriculumId] = useState("");

  const { calendars, isLoading: calendarsLoading } = useGetCalendars();
  const sortedTerms = useMemo(
    () => getSortedSchoolTerms(calendars ?? []),
    [calendars]
  );

  const { curricula } = useGetCurricula("", 1, 200);

  const curriculumOptions = useMemo(() => {
    const options = [
      { value: "", label: "All curricula" },
      ...((curricula as CurriculumRecord[])?.map((c) => ({
        value: c.id,
        label: c.name,
      })) ?? []),
    ];
    return options;
  }, [curricula]);

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

  const handleCurriculumChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedCurriculumId(event.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const { assignments, isLoading, paginationValues, refetch } = useGetAssignments(
    currentPage,
    useDebouncer(searchQuery),
    selectedTeacher,
    selectedClass,
    undefined,
    selectedTermId || undefined,
    selectedCurriculumId || undefined
  );

  return (
    <div>
      <div className="flex justify-between items-end flex-wrap gap-4 w-full mb-5 px-0.5">
        <div className="flex flex-wrap gap-2 items-end">
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
          <div className="min-w-[200px] max-w-[300px] w-full sm:w-auto">
            <TermFilterCard
              calendars={calendars ?? []}
              calendarsLoading={calendarsLoading}
              sortedTerms={sortedTerms}
              value={selectedTermId}
              onChange={(id) => {
                setSelectedTermId(id);
                setCurrentPage(1);
              }}
              includeAllOption
              hideLabel
              fitFilterGrid
              className="mb-0!"
            />
          </div>
          <CustomSelectTag
            selectClassName="py-2.5"
            value={selectedCurriculumId}
            options={curriculumOptions}
            onOptionItemClick={handleCurriculumChange}
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


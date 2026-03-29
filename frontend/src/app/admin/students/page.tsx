"use client";
import StudentsTable from "@/components/admin/students/StudentsTable";
import { Pagination } from "@/components/common/Pagination";
import { SearchBar } from "@/components/common/SearchBar";
import { useDebouncer } from "@/hooks/generalHooks";
import { useGetSchoolUsers } from "@/hooks/school-admin";
import { Select } from "@mantine/core";
import React, { useEffect, useState } from "react";

const ADMIN_STUDENT_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "archived", label: "Archived" },
];

const Students = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const { paginationValues, schoolUsers, isLoading, refetch } = useGetSchoolUsers(
    currentPage,
    useDebouncer(searchQuery),
    selectedStatus,
    "",
    "Student"
  );

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 w-full mb-5 px-0.5">
        <SearchBar
          onSearch={handleSearch}
          className="w-[366px] max-md:w-full"
        />
        <Select
          label="Account status"
          placeholder="All statuses"
          data={ADMIN_STUDENT_STATUS_OPTIONS}
          value={selectedStatus}
          onChange={(v) => setSelectedStatus(v ?? "")}
          searchable={false}
          className="w-[min(220px,100%)] min-w-[180px]"
          comboboxProps={{ withinPortal: true }}
        />
      </div>
      <StudentsTable students={schoolUsers} refetch={refetch} busy={isLoading} />
      <Pagination
        currentPage={currentPage}
        totalPages={paginationValues?.totalPages || 1}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default Students;

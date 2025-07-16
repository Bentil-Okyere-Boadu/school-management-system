"use client";

import StudentsTable from "@/components/teacher/students/StudentsTable";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import FilterButton from "@/components/common/FilterButton";
import { Pagination } from "@/components/common/Pagination";
import { SearchBar } from "@/components/common/SearchBar";
// import { useDebouncer } from "@/hooks/generalHooks";
import { useGetStudents } from "@/hooks/teacher";
import React, { useState } from "react";

const Students = () => {
  const [currentPage, setCurrentPage] = useState(1);
  // const [searchQuery, setSearchQuery] = useState("");
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");

  const statusOptions = [
    { value: "", label: "Status" },
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" },
  ];

  const handleSearch = (query: string) => {
    // setSearchQuery(query);
    console.log(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    setSelectedStatus(selectedValue);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const {studentsData} = useGetStudents();

  return (
    <div>
      <div className="flex justify-between items-center flex-wrap gap-4 w-full mb-5 px-0.5">
        <SearchBar
          onSearch={handleSearch}
          className="w-[366px] max-md:w-full"
        />
      </div>
      <div className="flex flex-col items-end mb-4 px-1">
        <FilterButton
          onClick={() => setShowFilterOptions(!showFilterOptions)}
        />
        {showFilterOptions && (
          <div className="flex gap-3 mt-3">
            <CustomSelectTag
              value={selectedStatus}
              options={statusOptions}
              onOptionItemClick={handleStatusChange}
            />
          </div>
        )}
      </div>
      <StudentsTable students={studentsData} />
      <Pagination
        currentPage={currentPage}
        totalPages={1}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default Students;

"use client";

import React, { useState } from 'react'
import { ClassCard } from '@/components/admin/classes/ClassCard';
import { SearchBar } from '@/components/common/SearchBar';
import NoAvailableEmptyState from '@/components/common/NoAvailableEmptyState';
import { ClassLevel } from "@/@types";
import { useGetTeacherClasses } from "@/hooks/teacher";
import { useDebouncer } from '@/hooks/generalHooks';
import { useRouter } from "next/navigation";


const ClassesPage = () => {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");

  const { classLevels } = useGetTeacherClasses(useDebouncer(searchQuery));

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const onNavigateToAttendance = (data: ClassLevel) => {
    router.push(`/teacher/classes/${data.id}/attendance`)
  }

  return (
    <div className="pb-8">
      <div className="flex justify-between items-center flex-wrap gap-4 w-full mb-5 px-0.5">
        <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full" />
      </div>
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 py-6 px-0.5">
        {classLevels?.map((data, index) => (
          <ClassCard
            key={index + "12"}
            classData={data}
            studentCount={data?.studentCount}
            showGoToAttendance={true}
            onNavigateToAttendanceClick={onNavigateToAttendance}
          />
        ))}
      </section>
      {
        classLevels.length === 0 && (
            <NoAvailableEmptyState message="No class available" />
          )
      }
    </div>
  );
}

export default ClassesPage;
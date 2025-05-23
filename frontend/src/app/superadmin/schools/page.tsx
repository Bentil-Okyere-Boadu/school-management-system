"use client";
import React, { useState } from "react";
import SchoolCard from "@/components/common/SchoolCard";
import { SearchBar } from "@/components/common/SearchBar";
import { useRouter } from "next/navigation";
import { useGetAllSchools } from "@/hooks/super-admin";
import { useDebouncer } from "@/hooks/generalHooks";


const SchoolsPage: React.FC = () => {
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSchoolCardClick = (schoolId: string) => {
    router.push(`/superadmin/schools/${schoolId}`);
  };

  const { schools } = useGetAllSchools(currentPage, useDebouncer(searchQuery));
  return (
    <div className="px-0.5">
      <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full" />

      <section className="flex flex-wrap gap-5 items-center text-sm leading-4 text-center text-zinc-700 py-6">
        {schools?.map((school, index: number) => (
          <SchoolCard
            onNavigateToSchoolDetail={() => handleSchoolCardClick(school.id)}
            key={school.id}
            schoolName={school.name}
            schoolId={school.id}
            logoUrl={'https://cdn.builder.io/api/v1/image/assets/TEMP/f33b143daa0a988b8358b2dd952c60f8aadfc974?placeholderIfAbsent=true&apiKey=61b68a6030a244f09df9bfa72093b1ab'}
            backgroundColor={index%2 === 0 ? 'bg-violet-200': 'bg-red-100'}
            textColor={index%2 === 0 ? 'text-zinc-600': ''}
          />
        ))}
      </section>
    </div>
  );
};

export default SchoolsPage;
"use client";
import React from "react";
import SchoolCard from "@/components/common/SchoolCard";
import { SearchBar } from "@/components/common/SearchBar";
import { useRouter } from "next/navigation";
import { useGetAllSchools } from "@/hooks/users";


const SchoolsPage: React.FC = () => {
  const router = useRouter();

  const handleSearch = (query: string) => {
    console.log("Search query:", query);
  };

  const handleSchoolCardClick = (schoolId: string) => {
    router.push(`/superadmin/schools/${schoolId}`);
  };

  const { schools } = useGetAllSchools();
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
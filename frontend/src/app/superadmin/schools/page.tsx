"use client";
import React from "react";
import SchoolCard from "@/components/superadmin/schools/SchoolCard";
import { SearchBar } from "@/components/common/SearchBar";
import { useRouter } from "next/navigation";

interface School {
  id: number;
  name: string;
  logoUrl: string;
  backgroundColor: string;
  textColor?: string;
}


const SchoolsPage: React.FC = () => {
  // const backgroundImageUrl = "https://cdn.builder.io/api/v1/image/assets/TEMP/7ec195fa3d12eb6996d385bf89cb7df8a663c9a3?placeholderIfAbsent=true&apiKey=61b68a6030a244f09df9bfa72093b1ab";
  const router = useRouter();
  const schools: School[] = [
    {
      id: 1,
      name: "Bay Christian Int. School",
      logoUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/03f74e0e90605a277d24955827e92a03d39808a0?placeholderIfAbsent=true&apiKey=61b68a6030a244f09df9bfa72093b1ab",
      backgroundColor: "bg-red-100",
    },
    {
      id: 2,
      name: "Bay Christian Int. School",
      logoUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/f33b143daa0a988b8358b2dd952c60f8aadfc974?placeholderIfAbsent=true&apiKey=61b68a6030a244f09df9bfa72093b1ab",
      backgroundColor: "bg-violet-200",
      textColor: "text-zinc-600",
    },
    {
      id: 3,
      name: "Bay Christian Int. School",
      logoUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/03f74e0e90605a277d24955827e92a03d39808a0?placeholderIfAbsent=true&apiKey=61b68a6030a244f09df9bfa72093b1ab",
      backgroundColor: "bg-red-100",
    },
    {
      id: 4,
      name: "Bay Christian Int. School",
      logoUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/f33b143daa0a988b8358b2dd952c60f8aadfc974?placeholderIfAbsent=true&apiKey=61b68a6030a244f09df9bfa72093b1ab",
      backgroundColor: "bg-violet-200",
      textColor: "text-zinc-600",
    },
    {
      id: 5,
      name: "Bay Christian Int. School",
      logoUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/03f74e0e90605a277d24955827e92a03d39808a0?placeholderIfAbsent=true&apiKey=61b68a6030a244f09df9bfa72093b1ab",
      backgroundColor: "bg-red-100",
    },
    {
      id: 6,
      name: "Bay Christian Int. School",
      logoUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/f33b143daa0a988b8358b2dd952c60f8aadfc974?placeholderIfAbsent=true&apiKey=61b68a6030a244f09df9bfa72093b1ab",
      backgroundColor: "bg-violet-200",
      textColor: "text-zinc-600",
    },
  ];

  const handleSearch = (query: string) => {
    console.log("Search query:", query);
  };

  const handleSchoolCardClick = (schoolId: number) => {
    router.push(`/superadmin/schools/${schoolId}`);
  };


  return (
    <div className="px-0.5">
      <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full" />

      <section className="flex flex-wrap gap-5 items-center text-sm leading-4 text-center text-zinc-700 py-6">
        {schools.map((school) => (
          <SchoolCard
            onNavigateToSchoolDetail={() => handleSchoolCardClick(school.id)}
            key={school.id}
            schoolName={school.name}
            logoUrl={school.logoUrl}
            backgroundColor={school.backgroundColor}
            textColor={school.textColor}
          />
        ))}
      </section>
    </div>
  );
};

export default SchoolsPage;
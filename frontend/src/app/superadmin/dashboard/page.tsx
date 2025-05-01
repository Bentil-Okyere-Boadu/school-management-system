"use client";
import React from "react";
import StatCard from "@/components/superadmin/dashboard/StatCard";
import { SearchBar } from "@/components/common/SearchBar";

const DashboardPage: React.FC = () => {
  const stats = [
    {
      value: "15, 430",
      label: "Total Schools",
      iconUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/c3d541059700afe9fbaad586ff43480ff7d93786?placeholderIfAbsent=true",
      iconAlt: "School Icon",
      valueColor: "#F081AE",
    },
    {
      value: "2, 347",
      label: "Total Teachers",
      iconUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/36a067b5f7f8490f5bc5c8962136645a32f17f39?placeholderIfAbsent=true",
      iconAlt: "Teacher Icon",
      valueColor: "#597AE8",
    },
    {
      value: "5, 192",
      label: "Total Students",
      iconUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/5cdc8e15cdd19351c9962680fff3b3636cd00e80?placeholderIfAbsent=true",
      iconAlt: "Student Icon",
      valueColor: "#BD7CEB",
    },
    {
      value: "82%",
      label: "Average Attendance Rate",
      iconUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/ba656832819e22052f838d66aeb1b30662f1df92?placeholderIfAbsent=true",
      iconAlt: "Attendance Icon",
      valueColor: "#64DB9E",
    },
  ];

  const handleSearch = (query: string) => {
    console.log("Search query:", query);
  };

  return (
    <div className="px-0.5">
      <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full" />

      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 py-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            value={stat.value}
            label={stat.label}
            iconUrl={stat.iconUrl}
            iconAlt={stat.iconAlt}
            valueColor={stat.valueColor}
          />
        ))}
      </section>
    </div>
    
  );
};

export default DashboardPage;
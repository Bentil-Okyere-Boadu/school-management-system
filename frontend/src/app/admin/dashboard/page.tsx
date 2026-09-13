'use client'
import { useGetAdminDashboardStats, useGetSchoolUsers } from '@/hooks/school-admin'
import React, { useState } from 'react'
import { DashboardTable } from '@/components/admin/dashboard/DashboardTable'
import CustomBarChart from '@/components/admin/dashboard/CustomBarChart'
import StatCard from '@/components/admin/dashboard/StatCard'
import { SearchBar } from '@/components/common/SearchBar'
import { useDebouncer } from "@/hooks/generalHooks";

const AdminDashboard = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");

      const { dashboardStats } = useGetAdminDashboardStats();

    const stats = [
      {
        value: dashboardStats?.totalTeachers || 0,
        label: "Total Teachers",
        iconUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/36a067b5f7f8490f5bc5c8962136645a32f17f39?placeholderIfAbsent=true",
        iconAlt: "School Icon",
        valueColor: "#597AE8",
      },
      {
        value: dashboardStats?.totalStudents || 0,
        label: "Total Students",
        iconUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/5cdc8e15cdd19351c9962680fff3b3636cd00e80?placeholderIfAbsent=true",
        iconAlt: "Teacher Icon",
        valueColor: "#BD7CEB",
      },
      {
        value: dashboardStats?.totalApplications || 0,
        label: "Total Applications",
        iconUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/2c8ec1dbb54a09a6027cd0a05fdb19c1c60805d1?placeholderIfAbsent=true",
        iconAlt: "Student Icon",
        valueColor: "#F081AE",
      },
      {
        value: (dashboardStats?.averageAttendanceRate ?? 0) + "%",
        label: "Average Attendance Rate",
        iconUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/ba656832819e22052f838d66aeb1b30662f1df92?placeholderIfAbsent=true",
        iconAlt: "Attendance Icon",
        valueColor: "#64DB9E",
      },
    ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const { schoolUsers, refetch, isLoading: isSchoolUsersLoading } = useGetSchoolUsers(currentPage, useDebouncer(searchQuery), "", "", "", 6);

  return (
    <div>

      <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full mx-0.5" />

      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 py-6 px-0.5">
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

      <CustomBarChart dataList={dashboardStats?.attendanceByClass || []} />

      <div className="mt-10 p-6 bg-white rounded-lg">
        <DashboardTable schoolUsers={schoolUsers} refetch={refetch} busy={isSchoolUsersLoading} />
      </div>
    </div>
  )
}

export default AdminDashboard

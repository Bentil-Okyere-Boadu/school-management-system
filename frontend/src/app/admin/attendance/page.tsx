"use client";
import React, { useState } from 'react'
import StatCard from '@/components/admin/attendence/StatsCard';

const Attendance = () => {
  const [alreadyDone] = useState(false);
  
  const stats = [
    {
      label: "Total Attendance Count",
      value: "2,347",
      fromColor: "#2B62E5",
      toColor: "#8FB5FF",
    },
    {
      label: "Total Present Count",
      value: "2,347",
      fromColor: "#B55CF3",
      toColor: "#D9A6FD",
    },
    {
      label: "Total Absent Count",
      value: "2,347",
      fromColor: "#F15580",
      toColor: "#F88FB3",
    },
    {
      label: "Average Attendance Rate",
      value: "87%",
      fromColor: "#30C97A",
      toColor: "#8DF4B8",
    },
  ];

  return (
    <div className="pb-8">
      Attendance
      {alreadyDone && (<section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 py-6 px-0.5">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </section>)}
    </div>
  );
}

export default Attendance
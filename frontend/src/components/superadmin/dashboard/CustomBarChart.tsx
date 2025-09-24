"use client";

import React from "react";
import { BarChart } from '@mantine/charts';
import { SchoolPerformance } from "@/@types";
import { useGetSchoolsPerformance } from "@/hooks/super-admin";


const CustomBarChart: React.FC = () => {

  const { schoolsPerformance: barChartData } = useGetSchoolsPerformance();

  // restructure backend data to for barchart consumption
  const data = barChartData?.map((school: SchoolPerformance) => ({
    name: school?.schoolName,
    'Top-performing': school?.topPerforming,
    'Low-performing': school?.lowPerforming,
  }));

  return (
    <div className="bg-[#fff] p-4 rounded-lg relative">
        <p className="top-0 lg:top-4 absolute font-semibold">Best & Worst Performing Schools</p>
        <BarChart
            h={320}
            data={data}
            dataKey="name"
            withLegend
            series={[
                { name: 'Top-performing', color: 'rgba(237, 148, 146, 0.7)' },
                { name: 'Low-performing', color: 'rgba(120, 229, 178, 0.7)' },
            ]}
            tickLine="x"
        />
    </div>
  );
};

export default CustomBarChart;

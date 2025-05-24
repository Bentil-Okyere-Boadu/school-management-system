"use client";

import React from "react";
import { BarChart } from '@mantine/charts';

const CustomBarChart: React.FC = () => {

    const data = [
        { name: 'Class 2', 'Attendence-Level': 1200 },
        { name: 'Class 3', 'Attendence-Level': 1900},
        { name: 'Class 4', 'Attendence-Level': 400 },
        { name: 'Class 5', 'Attendence-Level': 1000},
        { name: 'Class 6', 'Attendence-Level': 800},
        { name: 'Nursery 2', 'Attendence-Level': 750},
        { name: 'Nursey', 'Attendence-Level': 1200 },
        { name: 'KG 3', 'Attendence-Level': 1900},
        { name: 'KG 2', 'Attendence-Level': 400 },
        { name: 'JHS 1', 'Attendence-Level': 1000},
        { name: 'JHS 2', 'Attendence-Level': 800},
        { name: 'JHS 3', 'Attendence-Level': 750},
    ];

  return (
    <div className="bg-[#fff] p-4 rounded-lg relative pt-16">
        <p className="top-0 lg:top-4 absolute font-semibold"> Attendance Across Different Grades</p>
        <BarChart
            h={320}
            data={data}
            dataKey="name"
            series={[
                { name: 'Attendence-Level', color: 'rgba(237, 148, 146, 0.7)' },
            ]}
            tickLine="x"
        />
    </div>
  );
};

export default CustomBarChart;

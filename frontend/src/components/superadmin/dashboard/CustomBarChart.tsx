"use client";

import React from "react";
import { BarChart } from '@mantine/charts';

const CustomBarChart: React.FC = () => {

    const data = [
        { name: 'Bay Christian Int. Sch', 'Top-performing': 1200, 'Low-performing': 200 },
        { name: 'William Paden Sch', 'Top-performing': 1900,  'Low-performing': 400 },
        { name: 'Jefferson Elemen Sch', 'Top-performing': 400,  'Low-performing': 200 },
        { name: 'Emerson Elem Sch', 'Top-performing': 1000, 'Low-performing': 800 },
        { name: 'King Child Dev Sch', 'Top-performing': 800,  'Low-performing': 1200 },
        { name: 'Hopeful Data Sch', 'Top-performing': 750, 'Low-performing': 1000 },
    ];

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

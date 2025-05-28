"use client";

import React from "react";
import { CompositeChart } from '@mantine/charts';

const CustomCompositeChart: React.FC = () => {

    const data = [
        { date: "Jan", value: 400 },
        { date: "Feb", value: 400 },
        { date: "Mar", value: 600 },
        { date: "Apr", value: 420 },
        { date: "May", value: 550 },
        { date: "June", value: 800 },
        { date: "July", value: 400 },
        { date: "Aug", value: 450 },
        { date: "Sep", value: 650 },
        { date: "Oct", value: 700 },
        { date: "Nov", value: 500 },
        { date: "Dec", value: 600 }
    ];

  return (
    <div className="bg-[#fff] p-4 rounded-lg relative pt-16">
      <p className="top-2 lg:top-4 absolute font-semibold">Application Trends Over Time</p>
      <CompositeChart
          h={320}
          data={data}
          dataKey="date"
          yAxisProps={{ domain: [0, 100] }}
          series={[{ name: 'value', color: 'indigo.6', type: 'area' }]}
          tickLine="x"
          curveType="linear"
      />
    </div>
  );
};

export default CustomCompositeChart;

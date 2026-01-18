"use client";

import React from "react";
import { CompositeChart } from '@mantine/charts';
interface CustomCompositeChartProps {
  monthlyTrends: {
    month: string;
    value: number;
  }[];
}

const CustomCompositeChart: React.FC<CustomCompositeChartProps> = ({monthlyTrends}) => {

  return (
    <div className="bg-[#fff] p-4 rounded-lg relative pt-16">
      <p className="top-2 lg:top-4 absolute font-semibold">Application Trends Over Time</p>
      <CompositeChart
          h={320}
          data={monthlyTrends}
          dataKey="month"
          series={[{ name: 'value', color: 'indigo.6', type: 'area' }]}
          tickLine="x"
          curveType="linear"
      />
    </div>
  );
};

export default CustomCompositeChart;

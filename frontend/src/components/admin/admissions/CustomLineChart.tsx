"use client";

import React from "react";
import { LineChart } from '@mantine/charts';

interface CustomLineChartProps {
    weeklyTrends: {
        date: string;
        value: number;
    }[];
}

const CustomLineChart: React.FC<CustomLineChartProps> = ({weeklyTrends}) => {

  return (
    <div className="bg-[#fff] p-4 rounded-lg relative pt-16">
      <p className="top-2 lg:top-4 absolute font-semibold">Admissions Over The Week</p>
        <LineChart
            h={200}
            data={weeklyTrends}
            dataKey="date"
            series={[{ name: 'value', color: 'red.6' }]}
            curveType="linear"
            connectNulls
        />
    </div>
  );
};

export default CustomLineChart;

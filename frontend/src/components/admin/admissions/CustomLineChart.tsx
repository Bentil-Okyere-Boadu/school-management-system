"use client";

import React from "react";
import { LineChart } from '@mantine/charts';

const CustomLineChart: React.FC = () => {

    const data = [
        {
            date: 'Mar 22',
            value: 110,
        },
        {
            date: 'Mar 23',
            value: 60,
        },
        {
            date: 'Mar 24',
            value: null,
        },
        {
            date: 'Mar 28',
            value: 200,
        },
        {
            date: 'Mar 29',
            value: 80,
        },
        {
            date: 'Mar 31',
            value: 20,
        },
    ];

  return (
    <div className="bg-[#fff] p-4 rounded-lg relative pt-16">
      <p className="top-2 lg:top-4 absolute font-semibold">Admissions Over The Week</p>
        <LineChart
            h={200}
            data={data}
            dataKey="date"
            series={[{ name: 'value', color: 'red.6' }]}
            curveType="linear"
            connectNulls
        />
    </div>
  );
};

export default CustomLineChart;

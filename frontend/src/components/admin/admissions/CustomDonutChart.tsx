"use client";

import React from "react";
import { DonutChart } from '@mantine/charts';

const CustomDonutChart: React.FC = () => {

    const data = [
        { name: 'Applications Recieved', value: 400, color: '#EF2A82' },
        { name: 'Applications Accepted', value: 300, color: '#FF9500' },
        { name: 'Applications Rejected', value: 100, color: '#3DD598' },
        { name: 'Applications Pending', value: 200, color: '#0088F0' },
    ];

    return (
        <div className="relative inline-block w-[200px] h-[200px]">
            <DonutChart
                data={data}
                size={200}
                thickness={8}
                chartLabel="" // empty to disable default label
                withTooltip={false}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <div className="text-lg font-semibold text-gray-800">422,870</div>
                <div className="text-sm text-gray-500">Applications this year</div>
            </div>
        </div>
    );
};

export default CustomDonutChart;

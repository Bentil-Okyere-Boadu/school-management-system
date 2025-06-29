"use client";

import React from "react";
import { DonutChart } from '@mantine/charts';

interface CustomDonutChartProps {
    totalApplicationsCount: number;
    statusBreakdown: {
        name: string;
        value: number;
        rate: string;
    }[];
}

const CustomDonutChart: React.FC<CustomDonutChartProps> = ({totalApplicationsCount, statusBreakdown}) => {

    const statusColorMap: Record<string, string> = {
        "Applications Received": "#0088F0", // blue
        "Applications Accepted": "#3DD598", // green
        "Applications Rejected": "#EF2A82", // red
        "Applications Pending": "#FF9500",   // orange
    };

    const donutChartData = statusBreakdown?.map(item => ({
        name: item.name,
        value: item.value,
        color: statusColorMap[item.name] || "#ccc",
    }));

    return (
        <div className="relative inline-block w-[200px] h-[200px]">
            <DonutChart
                data={donutChartData}
                size={200}
                thickness={8}
                chartLabel="" // empty to disable default label
                withTooltip={false}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <div className="text-lg font-semibold text-gray-800">{totalApplicationsCount}</div>
                <div className="text-sm text-gray-500">Applications this year</div>
            </div>
        </div>
    );
};

export default CustomDonutChart;

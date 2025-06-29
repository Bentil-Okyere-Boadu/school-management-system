"use client";

import React from "react";

interface ApplicationStatsTableProps {
    statusBreakdown: {
        name: string;
        value: number;
        rate: string;
    }[];
}

const ApplicationStatsTable: React.FC<ApplicationStatsTableProps> = ({statusBreakdown}) => {

    const colorMap: Record<string, string> = {
        "Applications Received": "#0088F0", // blue
        "Applications Accepted": "#3DD598", // green
        "Applications Rejected": "#EF2A82", // red
        "Applications Pending": "#FF9500",   // orange
    };

    const data = statusBreakdown?.map(item => ({
        label: item.name,
        value: item?.value?.toLocaleString(), // formats 7491 → "7,491"
        rate: item.rate,
        color: colorMap[item.name] || "#000000",
    }));

    return (
        <div className="overflow-x-auto w-[500px] bg-white">
            <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                        <th className="px-2 py-3 font-medium"></th>
                        <th className="px-2 py-3 text-center font-medium">Total Users</th>
                        <th className="px-2 py-3 text-right font-medium">Rate</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-900 text-xs">
                    {data.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="px-2 py-3 flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0`} style={{ backgroundColor: item.color }} />
                                <span>{item.label}</span>
                            </td>
                            <td className="px-2 py-3 text-center">{item.value}</td>
                            <td className="px-2 py-3 text-right text-green-600 font-medium">{item.rate}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ApplicationStatsTable;

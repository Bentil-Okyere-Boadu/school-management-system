"use client";

import React from "react";

const ApplicationStatsTable: React.FC = () => {

    const data = [
        { label: "Applications Recieved", value: "57,914", rate: "81.94%", color: "bg-blue-600" },
        { label: "Applications Accepted", value: "54,914", rate: "81.94%", color: "bg-green-600" },
        { label: "Applications Rejected", value: "47,914", rate: "81.94%", color: "bg-red-400" },
        { label: "Applications Pending", value: "27,914", rate: "81.94%", color: "bg-orange-400" },
    ];

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
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.color}`} />
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

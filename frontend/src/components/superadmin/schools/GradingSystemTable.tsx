"use client";
import React from "react";

interface GradeData {
  grade: string;
  minRange: number;
  maxRange: number;
}

export const GradingSystemTable: React.FC = () => {

  const gradeData: GradeData[] = [
    { grade: "A", minRange: 80, maxRange: 80 },
    { grade: "B", minRange: 70, maxRange: 70 },
    { grade: "C", minRange: 60, maxRange: 60 },
    { grade: "D", minRange: 50, maxRange: 50 },
  ];


  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="">
          <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
          Grade Label
          </th>
          <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
          Minimum Range
          </th>
          <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
          Maximum Range
          </th>
        </tr>
      </thead>
      <tbody>
        {gradeData.map((data, index) => (
          <tr className="border-b border-solid border-b-gray-200" key={index + "12"}>
            <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
            {data.grade}
            </td>
            <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
            {data.minRange}
            </td>
            <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
            {data.maxRange}
            </td>
          </tr>
        ))}
      </tbody>
  </table>
  );
};
 
"use client";
import React from "react";

export interface FeeData {
  title: string;
  applyTo: string;
  duration: string;
  classLevel: string;
}


export const FeeStructureTable: React.FC = () => {

  const feeData: FeeData[] = [
    {
      title: "School Fees",
      applyTo: "All Students",
      duration: "Yearly",
      classLevel: "All Classes",
    },
    {
      title: "Admission Fees",
      applyTo: "New Students",
      duration: "Once",
      classLevel: "Class 4, Class 5, Class 6",
    },
  ];


  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="">
          <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
            Fee Title
          </th>
          <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
            Apply Fees To
          </th>
          <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
            Fee Duration
          </th>
          <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
            Class/Level
          </th>
        </tr>
      </thead>
      <tbody>
        {feeData.map((fee, index) => (
          <tr className="border-b border-solid border-b-gray-200" key={index + "12"}>
            <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
            {fee.title}
            </td>
            <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
            {fee.applyTo}
            </td>
            <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
            {fee.duration}
            </td>
            <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
            {fee.classLevel}
            </td>
          </tr>
        ))}
      </tbody>
  </table>
  );
};
 
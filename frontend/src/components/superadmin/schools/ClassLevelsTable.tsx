"use client";
import { ClassLevel } from "@/@types";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
import React from "react";

interface ClassLevelTableProps {
  classLevels: ClassLevel[];
}

export const ClassLevelTable: React.FC<ClassLevelTableProps> = ({classLevels}) => {

  return (
    <>
      <table className="w-full border-collapse">
        <thead>
          <tr className="">
            <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
            Name
            </th>
            <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
            Description
            </th>
          </tr>
        </thead>
        <tbody>
          {classLevels?.map((data, index) => (
            <tr className="border-b border-solid border-b-gray-200" key={index + "12"}>
              <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
              {data.name}
              </td>
              <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
              {data.description || '--'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {classLevels?.length === 0 && (
        <NoAvailableEmptyState message="No class level available." />
      )}
    </>
  );
};
 
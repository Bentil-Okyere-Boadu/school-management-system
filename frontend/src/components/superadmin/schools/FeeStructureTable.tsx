"use client";
import React from "react";
import { FeeStructure } from "@/@types";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
interface FeeStructureTableProps {
  feeStructures: FeeStructure[];
}


export const FeeStructureTable: React.FC<FeeStructureTableProps> = ({feeStructures}) => {

  return (
    <>
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
          {feeStructures?.length > 0 && feeStructures?.map((fee, index) => (
            <tr className="border-b border-solid border-b-gray-200" key={index + "12"}>
              <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
              {fee.feeTitle}
              </td>
              <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
              {fee.appliesTo}
              </td>
              <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
              {fee.dueDate}
              </td>
              <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
              {fee.classLevels && fee.classLevels.length > 0
                ? fee.classLevels.map((cl) => cl.name).join(', ')
                : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {feeStructures?.length === 0 && (
        <NoAvailableEmptyState message="No fee structure available." />
      )}
    </>
  );
};
 
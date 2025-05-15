"use client";
import React from "react";
import SchoolCard from "../../common/SchoolCard";
import { FeeStructureTable } from "./FeeStructureTable";
import { GradingSystemTable } from "./GradingSystemTable";
import DocumentItem from "../../common/DocumentItem";
import { School } from "@/@types";

interface SchoolSettingsTabProps {
  schoolData: School
}

export const SchoolSettingsTabSection: React.FC<SchoolSettingsTabProps> = ({ schoolData }) => {
  const documents: {
    id: number;
    name: string;
    width: string;
}[] = [];

  return (
    <div className="pb-8">
      <h1 className="text-md font-semibold text-neutral-800 mb-2">School Logo</h1>
      <SchoolCard
        key="school-1"
        logoUrl="https://cdn.builder.io/api/v1/image/assets/TEMP/f33b143daa0a988b8358b2dd952c60f8aadfc974?placeholderIfAbsent=true&apiKey=61b68a6030a244f09df9bfa72093b1ab"
        backgroundColor="bg-[#FFF]"
      />

      <div className="mt-8">
        <h1 className="text-md font-semibold text-neutral-800 mb-2">Fee Structure</h1>
        <FeeStructureTable feeStructures={schoolData?.feeStructures}  />
      </div>

      <div className="mt-8">
        <h1 className="text-md font-semibold text-neutral-800 mb-2">Grading System</h1>
        <GradingSystemTable gradingSystems={schoolData?.gradingSystems} />
      </div>

      <div className="mt-8">
        <h1 className="text-md font-semibold text-neutral-800 mb-2">Admission Policies</h1>
        <section className="flex flex-wrap gap-5 items-center text-base tracking-normal text-gray-800">
          {documents.map((doc) => (
            <DocumentItem
              key={doc.id}
              name={doc.name}
              width={doc.width}
            />
          ))}
        </section>
      </div>
    </div>
  );
};
 
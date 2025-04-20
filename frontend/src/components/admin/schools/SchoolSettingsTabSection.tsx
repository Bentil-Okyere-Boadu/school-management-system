"use client";
import React from "react";
import SchoolCard from "./SchoolCard";
import { FeeStructureTable } from "./FeeStructureTable";
import { GradingSystemTable } from "./GradingSystemTable";
import DocumentItem from "./DocumentItem";


export const SchoolSettingsTabSection: React.FC = () => {
  const documents = [
    {
      id: 1,
      name: "Admission Policy 2.0 .pdf",
      iconSrc: "https://cdn.builder.io/api/v1/image/assets/TEMP/bfa753382821c56f422e85b55d181831a23fe03c?placeholderIfAbsent=true&apiKey=61b68a6030a244f09df9bfa72093b1ab",
      width: "231px",
    },
    {
      id: 2,
      name: "Fee Policy .pdf",
      iconSrc: "https://cdn.builder.io/api/v1/image/assets/TEMP/198bfd722981a6cdf52cc53d313091d58e8819e4?placeholderIfAbsent=true&apiKey=61b68a6030a244f09df9bfa72093b1ab",
      width: "160px", // w-40 = 10rem = 160px
    },
    {
      id: 3,
      name: "Admission Policy 3.0 .pdf",
      iconSrc: "https://cdn.builder.io/api/v1/image/assets/TEMP/bad3d7f049850012ef0fab3c77419f9d4bc94424?placeholderIfAbsent=true&apiKey=61b68a6030a244f09df9bfa72093b1ab",
      width: "232px",
    },
  ];

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
        <FeeStructureTable />
      </div>

      <div className="mt-8">
        <h1 className="text-md font-semibold text-neutral-800 mb-2">Grading System</h1>
        <GradingSystemTable />
      </div>

      <div className="mt-8">
        <h1 className="text-md font-semibold text-neutral-800 mb-2">Admission Policies</h1>
        <section className="flex flex-wrap gap-5 items-center text-base tracking-normal text-gray-800">
          {documents.map((doc) => (
            <DocumentItem
              key={doc.id}
              iconSrc={doc.iconSrc}
              name={doc.name}
              width={doc.width}
            />
          ))}
        </section>
      </div>
    </div>
  );
};
 
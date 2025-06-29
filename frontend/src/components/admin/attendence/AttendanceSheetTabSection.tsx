"use client";

import React, { useState } from "react";
import { SearchBar } from "@/components/common/SearchBar";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import Image from 'next/image'
import Mark from '@/images/Mark.svg'
import Cancel from '@/images/Cancel.svg'

export const AttendanceSheetTabSection: React.FC= () => {

  const data = [
    {
      name: 'Brooklyn Simmons',
      grade: '10th',
      attendance: [true, true, true, true, true, false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, false, true, true, true, true, true, true, false, true, false]
    },
    {
      name: 'Jenny Wilson',
      grade: 'Class 9',
      attendance: [false, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, true, false, true]
    },
    {
      name: 'Floyd Miles',
      grade: 'Class 5',
      attendance: [false, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, true, false, true]
    },
    {
      name: 'Devon Lane',
      grade: '9th',
      attendance: [true, true, true, true, true, false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, false, true, true, true, true, true, true, false, true, true]
    },
    {
      name: 'Jane Cooper',
      grade: '11th',
      attendance: [true, true, true, true, true, false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, false, true, true, true, true, true, true, false, true, true]
    },
    {
      name: 'Leslie Alexander',
      grade: 'Class 3',
      attendance: [false, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, true, false, true]
    },
    {
      name: 'Jerome Bell',
      grade: '7th',
      attendance: [true, true, true, true, true, false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, false, true, true, true, true, true, true, false, true, true]
    },
    {
      name: 'Darlene Robertson',
      grade: '6th',
      attendance: [false, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, true, false, true]
    },
      {
      name: 'Devon Lane',
      grade: '9th',
      attendance: [true, true, true, true, true, false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, false, true, true, true, true, true, true, false, true, true]
    },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    console.log(currentPage, searchQuery);
  };

  const handleStudentAttendance = (student: object) => {
    console.log(student);
  };


  return (
    <div className="pb-8">

      <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full" />

      <div className="flex gap-3 my-6">
        <CustomSelectTag value={'Week'} options={[{label: 'Week', value: 'week'}]} onOptionItemClick={() => {}} />
        <CustomSelectTag value={'Month'} options={[{label: 'Month', value: 'month'}]}  onOptionItemClick={() => {}} />
        <CustomSelectTag value={'Year'} options={[{label: 'Year', value: 'year'}]}  onOptionItemClick={() => {}} />
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1200px] grid grid-cols-[200px_140px_repeat(30,3rem)]">
          {/* Header */}
          <div className="sticky left-0 z-10 bg-gray-100 px-4 py-5 text-xs font-medium text-gray-500">Name</div>
          <div className="sticky left-[200px] z-10 bg-gray-100 px-4 py-5 text-xs font-medium text-gray-500">Class/Grade</div>
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className="px-2 py-5 text-xs font-medium text-gray-500 text-center bg-gray-100"
            >
              {i + 1}
            </div>
          ))}

          {/* Body */}
          {data.map((student, sIdx) => (
            <React.Fragment key={sIdx}>
              <div className="sticky left-0 z-10 bg-white px-4 py-5 border-b border-gray-200 whitespace-nowrap">
                {student.name}
              </div>
              <div className="sticky left-[200px] z-10 bg-white px-4 py-5 border-b border-gray-200">
                {student.grade}
              </div>
              {student.attendance.map((present, dIdx) => (
                <div
                  key={dIdx}
                  className={`px-2 py-5 border-b border-gray-200 flex items-center justify-center ${
                    (dIdx + 1) % 7 === 0 ? "bg-purple-100" : "bg-white"
                  }`}
                  onClick={()=>{handleStudentAttendance(student)}}
                >
                  <Image
                    src={present ? Mark : Cancel}
                    alt={present ? "Present" : "Absent"}
                    className="w-5 h-5 object-contain"
                    width={20}
                    height={20}
                  />
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
 
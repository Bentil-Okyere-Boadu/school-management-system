"use client";

import React, { useState } from "react";
import { SearchBar } from "@/components/common/SearchBar";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import { Menu } from "@mantine/core";
import { IconDots, IconMessageFilled } from "@tabler/icons-react";

export const AttendanceSummaryTabSection: React.FC= () => {

  const users =  [
    {
        "id": "4a4aab00-a0a0-4649-a903-516d100d704d",
        "firstName": "polivox",
        "lastName": "frisbook",
        "email": "polivox201@frisbook.com",
        "status": "active",
        "date": "Mar 25, 2024 at 04:50 PM",
        "grade": "Class A",
        "attendance": "433",
        "presentCount": "32",
        "absentCount": "23",
        "dayOfTerm": "12"
    },
    {
        "id": "2a1d1bae-967b-4d83-8a01-85beec41efd1",
        "firstName": "sibiro",
        "lastName": "betzenn",
        "email": "sibiro3056@betzenn.com",
        "status": "pending",
        "date": "Mar 25, 2024 at 04:50 PM",
        "grade": "Class A",
        "attendance": "433",
        "presentCount": "32",
        "absentCount": "23",
        "dayOfTerm": "12"
    },
    {
        "id": "95a5af8a-8fd6-433b-88f9-cb4ab7c682e3",
        "firstName": "jihebiw",
        "lastName": "ofular",
        "email": "jihebiw294@ofular.com",
        "status": "active",
        "date": "Mar 25, 2024 at 04:50 PM",
        "grade": "Class A",
        "attendance": "433",
        "presentCount": "32",
        "absentCount": "23",
        "dayOfTerm": "12"
    },
    {
        "id": "180fd60a-cedf-42b2-96a0-8216b3ec6fd0",
        "firstName": "nileyi",
        "lastName": "neuraxo",
        "email": "nileyi3109@neuraxo.com",
        "status": "pending",
        "date": "Mar 25, 2024 at 04:50 PM",
        "grade": "Class A",
        "attendance": "433",
        "presentCount": "32",
        "absentCount": "23",
        "dayOfTerm": "12"
    }
  ];
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    console.log(currentPage, searchQuery);
  };


  return (
    <div className="pb-8">

      <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full" />

      <div className="flex gap-3 my-6">
        <CustomSelectTag value={'Week'} options={[{label: 'Week', value: 'week'}]} onOptionItemClick={() => {}} />
        <CustomSelectTag value={'Month'} options={[{label: 'Month', value: 'month'}]}  onOptionItemClick={() => {}} />
        <CustomSelectTag value={'Year'} options={[{label: 'Year', value: 'year'}]}  onOptionItemClick={() => {}} />
      </div>

      <section className="bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-40 max-w-[240px]">
                  <div>Name</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                  <div>Class/Grade</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                  <div>Total Attendance</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[138px]">
                  <div>Present Count</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[138px]">
                  <div>Absent Count</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[138px]">
                  <div>Total days of Term</div>
                </th>
                <th className="pr-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-right max-md:px-5 underline cursor-pointer"></th>
              </tr>
            </thead>
            <tbody>
              {users?.length > 0 ? (users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    {user.grade}
                  </td>
                  <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    {user.attendance}
                  </td>
                  <td
                    className={`px-6 py-6 leading-none text-center border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5`}
                  >
                    {user.presentCount}
                  </td>
                  <td
                    className={`px-6 py-6 leading-none text-center border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5`}
                  >
                    {user.absentCount}
                  </td>
                  <td
                    className={`px-6 py-6 leading-none text-center border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5`}
                  >
                    {user.dayOfTerm}
                  </td>
                  <td
                    className="border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)]"
                  >
                    <div className="flex items-center justify-end pr-6">
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <IconDots className="cursor-pointer" />
                        </Menu.Target>
                        <Menu.Dropdown className="!-ml-12 !-mt-2">
                          <Menu.Item 
                            onClick={() => {}} 
                            leftSection={<IconMessageFilled size={18} color="#AB58E7" />}>
                            Send Reminder
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </div>
                  </td>
                </tr>
              ))
              ) : (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                      <p className="text-lg font-medium">No users found</p>
                      <p className="text-sm text-gray-400 mt-1">Once users are added, they will appear in this table.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
 
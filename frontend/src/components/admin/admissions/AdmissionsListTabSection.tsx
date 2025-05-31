"use client";

import React, { useState } from "react";
import { SearchBar } from "@/components/common/SearchBar";
import FilterButton from "@/components/common/FilterButton";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import Badge from "@/components/common/Badge";
import { capitalizeFirstLetter } from "@/utils/helpers";
import { BadgeVariant } from "@/@types";

export const AdmissionsListTabSection: React.FC= () => {

  const users =  [
    {
        "id": "4a4aab00-a0a0-4649-a903-516d100d704d",
        "firstName": "polivox",
        "lastName": "frisbook",
        "email": "polivox201@frisbook.com",
        "status": "active",
        "date": "Mar 25, 2024 at 04:50 PM"
    },
    {
        "id": "2a1d1bae-967b-4d83-8a01-85beec41efd1",
        "firstName": "sibiro",
        "lastName": "betzenn",
        "email": "sibiro3056@betzenn.com",
        "status": "pending",
        "date": "Mar 25, 2024 at 04:50 PM"
    },
    {
        "id": "95a5af8a-8fd6-433b-88f9-cb4ab7c682e3",
        "firstName": "jihebiw",
        "lastName": "ofular",
        "email": "jihebiw294@ofular.com",
        "status": "active",
        "date": "Mar 25, 2024 at 04:50 PM"
    },
    {
        "id": "180fd60a-cedf-42b2-96a0-8216b3ec6fd0",
        "firstName": "nileyi",
        "lastName": "neuraxo",
        "email": "nileyi3109@neuraxo.com",
        "status": "pending",
        "date": "Mar 25, 2024 at 04:50 PM"
    }
  ];
  
  const statusOptions = [
    { value: "", label: "Status" },
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" }
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    console.log(currentPage, searchQuery);
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    setSelectedStatus(selectedValue);
  };

  return (
    <div className="pb-8">

      <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full" />

      <div className="flex flex-col items-end mb-4 px-1">
        <FilterButton onClick={() => setShowFilterOptions(!showFilterOptions)} />
        {showFilterOptions && (
          <div className="flex gap-3 mt-3">
            <CustomSelectTag value={selectedStatus} options={statusOptions} onOptionItemClick={handleStatusChange} />
          </div>
        )}
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
                  <div>Email</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                  <div>Submit Time</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[138px]">
                  <div>Status</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {users?.length > 0 ? (users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    {user.email}
                  </td>
                  <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    {user.date}
                  </td>
                  <td
                    className={`px-6 py-6 leading-none text-center border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5`}
                  >
                    <div className="flex items-center justity-start">
                      <Badge 
                        text={capitalizeFirstLetter(user.status)}
                        showDot={true} 
                        variant={user.status as BadgeVariant} />
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
 
"use client";

import React, { useState } from "react";
import { SearchBar } from "@/components/common/SearchBar";
import FilterButton from "@/components/common/FilterButton";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import { AdmissionTableData } from "@/@types";
import { AdmissionStatusMenu } from "./AdmissionStatusMenu";
import { Menu } from "@mantine/core";
import { IconDots, IconEyeFilled, IconTrashFilled } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

interface AdmissionsListTabProps {
  handleSearch: (term: string) => void;
  admissionsList: AdmissionTableData[];
  selectedStatus: string;
  handleStatusChange: (status: string) => void;
}


export const AdmissionsListTabSection: React.FC<AdmissionsListTabProps> = ({handleSearch, admissionsList, selectedStatus, handleStatusChange}) => {
  const router = useRouter();

  const statusOptions = [
    { value: "", label: "Status" },
    { value: "in_progress", label: "In Progress" },
    { value: "pending", label: "Pending" }
  ];

  const [showFilterOptions, setShowFilterOptions] = useState(false);

  const onOptionItemClick = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    handleStatusChange(selectedValue);
  };

  const onAdmissionStatusClick = (item: object) => {
    console.log(item, "item");
  }

  return (
    <div>

      <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full ml-1" />

      <div className="flex flex-col items-end mb-4 px-1">
        <FilterButton onClick={() => setShowFilterOptions(!showFilterOptions)} />
        {showFilterOptions && (
          <div className="flex gap-3 mt-3">
            <CustomSelectTag value={selectedStatus} options={statusOptions} onOptionItemClick={onOptionItemClick} />
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
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[50px]"></th>
              </tr>
            </thead>
            <tbody>
              {admissionsList?.length > 0 ? (admissionsList.map((admission, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                    {admission.fullName}
                  </td>
                  <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    {admission.email}
                  </td>
                  <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    {admission.submittedAt}
                  </td>
                  <td
                    className={`px-6 py-6 leading-none text-center border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5`}
                  >
                    <div className="flex items-center justity-start">
                      <AdmissionStatusMenu status={admission.enrollmentStatus} onStatusClick={onAdmissionStatusClick} /> 
                    </div>
                  </td>
                  <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    <div className="flex items-center justify-end pr-6">
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <IconDots className="cursor-pointer" />
                        </Menu.Target>
                        <Menu.Dropdown className="!-ml-12 !-mt-2">
                          <Menu.Item leftSection={<IconEyeFilled size={18} color="#AB58E7" />}
                            onClick={() => router.push(`/admin/admissions/${admission.id}`)}
                          >
                            Full View
                          </Menu.Item>
                          <Menu.Item leftSection={<IconTrashFilled size={18} color="#AB58E7" /> }
                          >
                            Delete Records
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
 
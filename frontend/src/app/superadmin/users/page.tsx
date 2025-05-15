"use client";
import React, { useState } from "react";
import { Pagination } from "@/components/common/Pagination";
import { UserTable } from "@/components/superadmin/users/UsersTable";
import { SearchBar } from "@/components/common/SearchBar";
import FilterButton from "@/components/common/FilterButton";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import CustomButton from "@/components/Button";
import { Dialog } from "@/components/common/Dialog";
import { Select } from '@mantine/core';
import InputField from "@/components/InputField";
import { useGetAdminUsers, useInviteUser } from "@/hooks/users";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { getRoleId } from "@/utils/roles";
import { useAppContext } from "@/context/AppContext";
import { useQueryClient } from "@tanstack/react-query";
import { useDebouncer } from "@/hooks/generalHooks";

const UsersPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [isInviteUserDialogOpen, setIsInviteUserDialogOpen] = useState(false);
  const [selectedDataRole, setSelectedDataRole] = useState<string>("school_admin");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedStatus, setSelectedStatus] = useState('');

  const statusOptions = [
    { value: "", label: "Status" },
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" }
  ];
  const roles = [
    { value: "school_admin", label: "School Admin" },
  ];

  const queryClient = useQueryClient();

  const { adminUsers, paginationValues, refetch } = useGetAdminUsers(currentPage, useDebouncer(searchQuery), selectedStatus, "", 10);


  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    setSelectedStatus(selectedValue);
  };

  const { roles: Roles } = useAppContext();


  const handleRoleDataChange = (value: string) => {
    setSelectedDataRole(value);
  };

  const { mutate: invitation, isPending } = useInviteUser();

  const inviteUser = () => {
    if(userName && email) {
      invitation({ name: userName, email: email, roleId: getRoleId(Roles, selectedDataRole)}, {
        onSuccess: () => {
          toast.success('Invitation sent successfully.');
          setEmail("");
          setUserName("");
          setIsInviteUserDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: ['allAdminUsers']})
        },
        onError: (error) => {
          const axiosError = error as AxiosError;
          toast.error(axiosError.response?.statusText);
        }
      })
    } else {
      toast.error('Please enter details of user to invite.');
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center flex-wrap gap-4 w-full mb-5 px-0.5">
        <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full" />
        <CustomButton text="Invite New User" onClick={() => setIsInviteUserDialogOpen(true)} />
      </div>
      <div className="flex flex-col items-end mb-4 px-1">
        <FilterButton onClick={() => setShowFilterOptions(!showFilterOptions)} />
        {showFilterOptions && (
          <div className="flex gap-3 mt-3">
            <CustomSelectTag value={selectedStatus} options={statusOptions} onOptionItemClick={handleStatusChange} />
          </div>
        )}
      </div>

      <UserTable users={adminUsers} refetch={refetch} onClearFilterClick={() => setSelectedStatus('')} />

      <Pagination
        currentPage={currentPage}
        totalPages={paginationValues?.totalPages || 1}
        onPageChange={handlePageChange}
      />

      {/* Invite user dialog */}
      <Dialog 
        isOpen={isInviteUserDialogOpen}
        dialogTitle="Invite New User"
        saveButtonText="Save Changes"
        onClose={() => setIsInviteUserDialogOpen(false)} 
        onSave={() => inviteUser()}
        busy={isPending}
      >
        <p className="text-xs text-gray-500">User will receive email to accept invite and sign up</p>
        <div className="my-3 flex flex-col gap-4">
          <InputField
            className="!py-0"
            label="User Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            isTransulent={isPending}
          />

          <InputField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            isTransulent={isPending}
          />
            
          <Select
            label="Role"
            placeholder="Pick role"
            data={roles}
            value={selectedDataRole}
            onChange={() => handleRoleDataChange}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default UsersPage;
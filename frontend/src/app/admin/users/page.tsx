"use client";
import React, { useState } from "react";
import { Pagination } from "@/components/common/Pagination";
import { UserTable } from "@/components/admin/users/UsersTable";
import { SearchBar } from "@/components/common/SearchBar";
import FilterButton from "@/components/common/FilterButton";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import CustomButton from "@/components/Button";
import { Dialog } from "@/components/common/Dialog";
import { Select } from '@mantine/core';
import InputField from "@/components/InputField";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { useDebouncer } from "@/hooks/generalHooks";
import { useGetSchoolUsers, useInvitation } from "@/hooks/school-admin";
import { ErrorResponse, Roles } from "@/@types";

const UsersPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [isInviteUserDialogOpen, setIsInviteUserDialogOpen] = useState(false);
  const [selectedDataRole, setSelectedDataRole] = useState<string>("teacher");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedStatus, setSelectedStatus] = useState('');

  const queryClient = useQueryClient();

  const { schoolUsers, paginationValues, refetch } = useGetSchoolUsers(currentPage, useDebouncer(searchQuery), selectedStatus, "","",  10);

  const statusOptions = [
    { value: "", label: "Status" },
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" }
  ];
  const roles = [
    { value: "teacher", label: "Teacher" },
    { value: "student", label: "Student" }
  ];

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

  const handleRoleDataChange = (event: string = Roles.TEACHER) => {
    setSelectedDataRole(event);
  };

  const { mutate: invitation, isPending } = useInvitation(selectedDataRole);

  const inviteUser = () => {
    if(firstName && lastName && email) {
      invitation({ firstName: firstName, lastName: lastName, email: email }, {
        onSuccess: () => {
          toast.success('Invitation sent successfully.');
          setSelectedDataRole("");
          setEmail("");
          setFirstName("");
          setLastName("");
          setIsInviteUserDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: ['allSchoolUsers']})
        },
        onError: (error: unknown) => {
          toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
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

      <UserTable users={schoolUsers} refetch={refetch} onClearFilterClick={() => setSelectedStatus('')} />

      <Pagination
        currentPage={currentPage}
        totalPages={paginationValues?.totalPages || 1}
        onPageChange={handlePageChange}
      />

      {/* Invite user dialog */}
      <Dialog 
        isOpen={isInviteUserDialogOpen}
        dialogTitle="Invite New User"
        saveButtonText="Invite User"
        onClose={() => setIsInviteUserDialogOpen(false)} 
        onSave={() => inviteUser()}
        busy={isPending}
      >
        <p className="text-xs text-gray-500">User will receive email to accept invite and sign up</p>
        <div className="my-3 flex flex-col gap-4">
          <InputField
            className="!py-0"
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            isTransulent={isPending}
          />

          <InputField
            className="!py-0"
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
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
            onChange={(e) => handleRoleDataChange(e as string)}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default UsersPage;
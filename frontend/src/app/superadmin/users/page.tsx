"use client";
import React, { useState, useEffect } from "react";
import { Pagination } from "@/components/common/Pagination";
import { UserTable } from "@/components/superadmin/users/UsersTable";
import { SearchBar } from "@/components/common/SearchBar";
import FilterButton from "@/components/common/FilterButton";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import CustomButton from "@/components/Button";
import { Dialog } from "@/components/common/Dialog";
import { Select } from "@mantine/core";
import InputField from "@/components/InputField";
import {
  useGetAdminUsers,
  useGetAllSchools,
  useInviteUser,
} from "@/hooks/super-admin";
import { toast } from "react-toastify";
import { getRoleId } from "@/utils/roles";
import { useAppContext } from "@/context/AppContext";
import { useQueryClient } from "@tanstack/react-query";
import { useDebouncer } from "@/hooks/generalHooks";
import { ErrorResponse } from "@/@types";

const UsersPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [isInviteUserDialogOpen, setIsInviteUserDialogOpen] = useState(false);
  const [selectedDataRole, setSelectedDataRole] =
    useState<string>("school_admin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("");

  const statusOptions = [
    { value: "", label: "Status" },
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" },
    { value: "archived", label: "Archived" },
  ];
  const roles = [{ value: "school_admin", label: "School Admin" }];

  const queryClient = useQueryClient();

  const { adminUsers, paginationValues, refetch, isLoading } = useGetAdminUsers(
    currentPage,
    useDebouncer(searchQuery),
    selectedStatus,
    "",
    10,
  );
  const { schools } = useGetAllSchools(1, "", "", "", 100);
  const activeSchoolOptions = schools
    .filter(
      (school) => school.provisioningStatus === "active" && !school.isDisabled,
    )
    .map((school) => ({ value: school.id, label: school.name }));

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

  useEffect(() => {
    refetch();
  }, [selectedStatus, refetch]);

  const { roles: Roles } = useAppContext();

  const handleRoleDataChange = (value: string) => {
    setSelectedDataRole(value);
  };

  const { mutate: invitation, isPending } = useInviteUser();

  const inviteUser = () => {
    if (firstName && lastName && email && schoolId) {
      invitation(
        {
          firstName: firstName,
          lastName: lastName,
          email: email,
          roleId: getRoleId(Roles, selectedDataRole),
          schoolId,
        },
        {
          onSuccess: () => {
            toast.success("Invitation sent successfully.");
            setEmail("");
            setFirstName("");
            setLastName("");
            setSchoolId(null);
            setIsInviteUserDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["allAdminUsers"] });
          },
          onError: (error: unknown) => {
            toast.error(
              JSON.stringify((error as ErrorResponse).response.data.message),
            );
          },
        },
      );
    } else {
      toast.error("Please enter user details and select an active school.");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center flex-wrap gap-4 w-full mb-5 px-0.5">
        <SearchBar
          onSearch={handleSearch}
          className="w-[366px] max-md:w-full"
        />
        <CustomButton
          text="Invite New User"
          onClick={() => setIsInviteUserDialogOpen(true)}
        />
      </div>
      <div className="flex flex-col items-end mb-4 px-1">
        <FilterButton
          onClick={() => setShowFilterOptions(!showFilterOptions)}
        />
        {showFilterOptions && (
          <div className="flex gap-3 mt-3">
            <CustomSelectTag
              value={selectedStatus}
              options={statusOptions}
              onOptionItemClick={handleStatusChange}
            />
          </div>
        )}
      </div>

      <UserTable
        users={adminUsers}
        refetch={refetch}
        onClearFilterClick={() => setSelectedStatus("")}
        busy={isLoading}
      />

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
        saveDisabled={
          !firstName || !lastName || !email || !schoolId || isPending
        }
      >
        <p className="text-xs text-gray-500">
          User will receive email to accept invite and sign up
        </p>
        <div className="my-3 flex flex-col gap-4">
          <InputField
            className="!py-0"
            label="First Name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            isTransulent={isPending}
          />

          <InputField
            className="!py-0"
            label="Last Name"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            isTransulent={isPending}
          />

          <InputField
            label="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            isTransulent={isPending}
          />

          <Select
            label="School"
            required
            placeholder={
              activeSchoolOptions.length
                ? "Pick an active school"
                : "Create and provision a school first"
            }
            data={activeSchoolOptions}
            value={schoolId}
            onChange={setSchoolId}
            disabled={isPending || activeSchoolOptions.length === 0}
          />

          <Select
            label="Role"
            required
            placeholder="Pick role"
            data={roles}
            value={selectedDataRole}
            onChange={(value) => value && handleRoleDataChange(value)}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default UsersPage;

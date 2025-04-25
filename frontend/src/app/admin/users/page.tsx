"use client";
import React, { useState } from "react";
import { Pagination } from "@/components/admin/Pagination";
import { UserTable } from "@/components/admin/users/UsersTable";
import { SearchBar } from "@/components/admin/SearchBar";
import FilterButton from "@/components/admin/FilterButton";
import { CustomSelectTag } from "@/components/admin/CustomSelectTag";
import CustomButton from "@/components/Button";
import { Dialog } from "@/components/admin/Dialog";
import MultiSelectDropdown from "@/components/admin/users/MultiSelectDropdown";
import SelectDropdown from "@/components/admin/users/SelectDropdown";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  permissions: string[];
  avatarUrl?: string;
  initials?: string;
}


const UsersPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDataRole, setSelectedDataRole] = useState<string>("school-admin");

  const mockUsers: User[] = [
    {
      id: "1",
      name: "Olivia Rhye",
      email: "oliviarr456@example.com",
      role: "Admin",
      status: "active",
      permissions: [
        "Manage Users",
        "Manage Schools",
        "Manage Resources",
        "View Reports",
      ],
      avatarUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/34e6a6b0bf75a410bbabb863c166f5f4fc26163d?placeholderIfAbsent=true",
    },
    {
      id: "2",
      name: "Phoenix Baker",
      email: "phoenixb675@example.com",
      role: "Product Manager",
      status: "active",
      permissions: ["Manage Users", "Manage Resources"],
      avatarUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/e309491124a4d6ead492c6cadaddbb678a76f647?placeholderIfAbsent=true",
    },
    {
      id: "3",
      name: "Lana Steiner",
      email: "lanalana2@example.com",
      role: "Frontend Developer",
      status: "inactive",
      permissions: ["Access Student Records"],
      avatarUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/2eeb0634df0591ecc5d2e81f11cc93acc1c72681?placeholderIfAbsent=true",
    },
    {
      id: "4",
      name: "Demi Wilkinson",
      email: "demiden673@example.com",
      role: "Backend Developer",
      status: "active",
      permissions: [
        "Manage Attendance",
        "Issue Books",
        "View Classes",
        "Manage Resources",
      ],
      avatarUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/2569f70420cd56d03dbc1a963dff7179a4e284e5?placeholderIfAbsent=true",
    },
    {
      id: "5",
      name: "Candice Wu",
      email: "cwugarder2784@example.com",
      role: "Fullstack Developer",
      status: "inactive",
      permissions: [
        "Manage Attendance",
        "Issue Books",
        "View Classes",
        "Manage Resources",
      ],
      initials: "CW",
    },
    {
      id: "6",
      name: "Drew Cano",
      email: "canoc567@example.com",
      role: "UX Copywriter",
      status: "active",
      permissions: ["Access Student Records", "View Classes"],
      avatarUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/535e19ff36e3473f814ab784d61ebb892a1f7abf?placeholderIfAbsent=true",
    },
    {
      id: "7",
      name: "Orlando Diggs",
      email: "orlandodigss2@example.com",
      role: "UI Designer",
      status: "inactive",
      permissions: ["Full Access"],
      initials: "OD",
    },
    {
      id: "8",
      name: "Andi Lane",
      email: "andilany@example.com",
      role: "Product Manager",
      status: "active",
      permissions: ["Manage Users", "Manage Schools", "View Reports"],
      avatarUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/24e96a3058ad88be38ca3d2472f4937e94117613?placeholderIfAbsent=true",
    },
    {
      id: "9",
      name: "Kate Morrison",
      email: "morrisonkatie@example.com",
      role: "QA Engineer",
      status: "inactive",
      permissions: [
        "Manage Users",
        "Manage Schools",
        "View Reports",
        "Manage Resources",
      ],
      avatarUrl: "https://cdn.builder.io/api/v1/image/assets/TEMP/6a03363d517bdd618192e9eb70b0b9a703447569?placeholderIfAbsent=true",
    },
  ];

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const roleOptions = [
    { value: "admin", label: "Admin" },
    { value: "projectManager", label: "Project Manager" },
  ];
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "in-active", label: "Inactive" },
  ];
  const premissionOptions = [
    { value: "manager-users", label: "Manage Users" },
    { value: "manage-schools", label: "Manage Schools" },
  ];
  const permissions = [
    { id: "manage-users", label: "Manage Users" },
    { id: "assign-grades", label: "Assign Grades" },
    { id: "view-reports", label: "View Reports" },
    { id: "data-reports", label: "Data Reports" }
  ];
  const roles = [
    { value: "school-admin", label: "School Admin" },
    { value: "teacher", label: "Teacher" },
    { value: "principal", label: "Principal" },
    { value: "district-admin", label: "District Admin" },
    { value: "student", label: "Student" },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    console.log("Selected:", selectedValue);
  };

  const handleUserRowClick = (userId: string) => {
    console.log(userId)
  }
  const handlePermissionChange = (selectedIds: string[]) => {
    console.log("Selected permissions:", selectedIds);
  };

  const handleRoleDataChange = (value: string) => {
    setSelectedDataRole(value);
    console.log("Selected role:", value);
  };

  return (
    <div>
      <div className="flex justify-between items-center flex-wrap gap-4 w-full mb-5 px-0.5">
        <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full" />
        <CustomButton text="Invite New User" onClick={() => setIsDialogOpen(true)} />
      </div>
      <div className="flex flex-col items-end mb-4 px-1">
        <FilterButton onClick={() => setShowFilterOptions(!showFilterOptions)} />
        {showFilterOptions && (
          <div className="flex gap-3 mt-3">
            <CustomSelectTag defaultValue="" optionLabel="Role" options={roleOptions} onOptionItemClick={handleRoleChange} />
            <CustomSelectTag defaultValue="" optionLabel="Status" options={statusOptions} onOptionItemClick={handleRoleChange} />
            <CustomSelectTag defaultValue="" optionLabel="Permissions" options={premissionOptions} onOptionItemClick={handleRoleChange} />
          </div>
        )}
      </div>

      <UserTable 
        users={filteredUsers} 
        onTableRowClick={(id) => handleUserRowClick(id)}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={10}
        onPageChange={handlePageChange}
      />
      <Dialog 
        isOpen={isDialogOpen}
        dialogTitle="Dialog Title"
        onClose={() => setIsDialogOpen(false)} 
        onSave={() => setIsDialogOpen(false)}
      >
        <div className="my-3 flex flex-col gap-4">
          <SelectDropdown
            id="role-select"
            label="Role"
            options={roles}
            selectedItem={selectedDataRole}
            onChange={handleRoleDataChange}
          />

          <MultiSelectDropdown
            items={permissions}
            selectedItems={["assign-grades"]}
            onChange={handlePermissionChange}
            label="Select Permissions"
          />
        </div>
      </Dialog>
    </div>
  );
};

export default UsersPage;
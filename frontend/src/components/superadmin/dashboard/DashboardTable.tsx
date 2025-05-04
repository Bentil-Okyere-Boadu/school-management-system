"use client";
import React, { useState } from "react";
import Badge from "../../common/Badge";
import { PermissionTags } from "../PermissionsTag";
import { Menu, MultiSelect , Select} from '@mantine/core';
import {
  IconPencil,
  IconSquareArrowDownFilled,
} from '@tabler/icons-react';
import { Dialog } from "@/components/common/Dialog";
import { getInitials } from "@/utils/helpers";
import { useRouter } from "next/navigation";

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

export const DashboardTable = () => {

  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [isConfirmArchiveDialogOpen, setIsConfirmArchiveDialogOpen] = useState(false);
  const [selectedDataRole, setSelectedDataRole] = useState<string | null>("school-admin");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["manage-users"]);
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter()

  const permissions = [
    { value: "manage-users", label: "Manage Users" },
    { value: "assign-grades", label: "Assign Grades" },
    { value: "view-reports", label: "View Reports" },
    { value: "data-reports", label: "Data Reports" }
  ];
  const roles = [
    { value: "school-admin", label: "School Admin" },
    { value: "ux-copywriter", label: "UX Copywriter" },
    { value: "UI Designer", label: "UI Designer" },
    { value: "product-manager", label: "Product Manager" },
    { value: "fullstack-developer", label: "Fullstack Developer" },
  ];

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
    }
  ];

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handlePermissionChange = (value: string[]) => {
    setSelectedPermissions(value)
    console.log("Selected permissions:", value);
  };

  const handleRoleDataChange = (value: string | null) => {
    setSelectedDataRole(value);
    console.log("Selected role:", value);
  };

  const onEditPermissionMenuItemClick = (user: User) => {
    setIsPermissionDialogOpen(true)

    const selectedRole = roles.find((r) => r.label === user.role);
    setSelectedDataRole(selectedRole?.value ?? null)

    const selectedPermissions = permissions
      .filter((perm) => user.permissions.includes(perm.label))
      .map((perm) => perm.value);

    setSelectedPermissions(selectedPermissions)
    console.log(user)
  }

  const onArchiveUserMenuItemClick = (user: User) => {
    setIsConfirmArchiveDialogOpen(true)
    console.log(user)
  }

  const onTableRowClick = (userId: string) => {
    console.log(userId)
  }

  const onGoToUsersView = () => {
    router.push('/superadmin/users')
  }
 
  const renderUser = (user: User) => {
    return (
        <div className="flex flex-1 items-center">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`${user.name}'s avatar`}
            className="mr-2.5 w-10 h-10 rounded-full"
          />
        ) : (
            <div className="mr-2.5 w-10 h-10 text-base text-violet-500 bg-purple-50 rounded-full flex items-center justify-center">
            {getInitials(user.name)}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-base text-zinc-800">{user.name}</span>
          <span className="text-sm text-neutral-500">{user.email}</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-bold text-md">Recently Added Users</h1>
        <div onClick={onGoToUsersView} className="flex items-center gap-1 text-purple-900 underline font-semibold cursor-pointer">
          <p className="text-xs">View more</p>
          <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/4d8890e47ae5922cab75f778cb06d458b12088a7?placeholderIfAbsent=true&apiKey=61b68a6030a244f09df9bfa72093b1ab"
            alt="Right arrow"
            className="object-contain w-2 h-2"
          />
        </div>
      </div>

      <section className="bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-60 max-w-[340px]">
                  <div>Name</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                  <div>Role</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[138px]">
                  <div className="flex gap-1 items-center">
                    <span>Status</span>
                    <img
                      src="https://cdn.builder.io/api/v1/image/assets/TEMP/a5b5f70481930cc666ac35bf17e5abb048a46a43?placeholderIfAbsent=true&apiKey=61b68a6030a244f09df9bfa72093b1ab"
                      className="object-contain shrink-0 w-4 aspect-square"
                      alt=""
                    />
                  </div>
                </th>
                <th className="pr-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-60 max-w-[350px]">
                  <div>Permissions</div>
                </th>
                <th className="pr-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-right max-md:px-5 underline cursor-pointer"></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} onClick={() => onTableRowClick?.(user.id)}>
                  <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                    {renderUser(user)}
                  </td>
                  <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    {user.role}
                  </td>
                  <td
                    className={`px-6 py-6 leading-none text-center border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] ${user.status === "active" ? "text-emerald-700" : "text-zinc-500"} max-md:px-5`}
                  >
                    <div className="flex items-center justity-start">
                      <Badge 
                          text={user.status === "active" ? "Active" : "Inactive"}
                          showDot={true} 
                          variant={user.status === 'active' ? 'green' : 'grey'} />
                    </div>
                  </td>
                  <td
                    className={` text-center border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:pl-5`}
                  >
                    <div
                      className={`flex gap-1.5 items-start justity-start }`}
                    >
                      <PermissionTags permissions={user.permissions} />
                    </div>
                  </td>
                    <td
                      className="border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)]"
                    >
                      <div className="flex items-center justify-end pr-6">
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                          <img
                            src="https://cdn.builder.io/api/v1/image/assets/TEMP/b2f2eaa24477a78660ce4a3d9636251012a42858?placeholderIfAbsent=true&apiKey=61b68a6030a244f09df9bfa72093b1ab"
                            className="object-contain self-stretch my-auto w-5 aspect-square cursor-pointer"
                            alt="Table cell icon"
                          />
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item 
                              onClick={() => onEditPermissionMenuItemClick(user)} 
                              leftSection={<IconPencil size={18} color="#AB58E7" />}>
                              Edit Permissions
                            </Menu.Item>
                            <Menu.Item 
                              onClick={() => onArchiveUserMenuItemClick(user)} 
                              leftSection={<IconSquareArrowDownFilled size={18} color="#AB58E7" />}>
                              Archive User
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit Permissions Dialog */}
      <Dialog 
        isOpen={isPermissionDialogOpen}
        dialogTitle="Edit Permissions"
        saveButtonText="Save Changes"
        onClose={() => setIsPermissionDialogOpen(false)} 
        onSave={() => setIsPermissionDialogOpen(false)}
      >
        <div className="my-3 flex flex-col gap-4">
          <Select
            label="Role"
            placeholder="Pick role"
            data={roles}
            value={selectedDataRole}
            onChange={handleRoleDataChange}
          />

          <MultiSelect
            label="Permissions"
            placeholder="Pick permissions"
            data={permissions}
            value={selectedPermissions}
            onChange={handlePermissionChange}
            searchable
            clearable
            withCheckIcon
          />
        </div>
      </Dialog>

      {/* Confirm Archive Dialog */}
      <Dialog 
        isOpen={isConfirmArchiveDialogOpen}
        dialogTitle="Confirm Archive"
        saveButtonText="Archive User"
        onClose={() => setIsConfirmArchiveDialogOpen(false)} 
        onSave={() => setIsConfirmArchiveDialogOpen(false)}
      >
        <div className="my-3 flex flex-col gap-4">
        <p>
          Are you sure you want to archive this user? Their account will be deactivated, but their data will be kept.
        </p>
        </div>
      </Dialog>
    </>
  );
}


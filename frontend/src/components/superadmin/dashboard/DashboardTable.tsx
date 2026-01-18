"use client";
import React, { useState } from "react";
import Badge from "../../common/Badge";
import { Menu, MultiSelect , Select} from '@mantine/core';
import {
  IconArrowRight,
  IconDots,
  IconSend2,
  IconSquareArrowDownFilled,
} from '@tabler/icons-react';
import { Dialog } from "@/components/common/Dialog";
import { capitalizeFirstLetter, getInitials } from "@/utils/helpers";
import { useRouter } from "next/navigation";
import { useArchiveUser, useResendAdminInvitation } from "@/hooks/super-admin";
import { toast } from "react-toastify";
import { ErrorResponse } from "@/@types";
import Image from "next/image";
import { HashLoader } from "react-spinners";

interface User {
  id: string;
  name?: string;
  email: string;
  firstName: string;
  lastName: string;
  status: "active" | "inactive" | "pending";
  role: {
    name: string;
    label: string;
  }
  isArchived?: boolean;
  profile: {
    avatarUrl?: string;
  }
}

interface UserTableProps {
  adminUsers: User[];
  refetch: () => void;
  busy?: boolean;
}

export const DashboardTable = ({adminUsers, refetch, busy}: UserTableProps) => {

  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [isConfirmArchiveDialogOpen, setIsConfirmArchiveDialogOpen] = useState(false);
  const [selectedDataRole, setSelectedDataRole] = useState<string | null>("school-admin");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["manage-users"]);
  const [selectedUser, setSelectedUser] = useState<User>({} as User);

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



  const handlePermissionChange = (value: string[]) => {
    setSelectedPermissions(value)
  };

  const handleRoleDataChange = (value: string | null) => {
    setSelectedDataRole(value);
  };

  const onArchiveUserMenuItemClick = (user: User) => {
    setIsConfirmArchiveDialogOpen(true);
    setSelectedUser(user);
  }

  const onTableRowClick = (userId: string) => {
    console.log(userId)
  }

  const onGoToUsersView = () => {
    router.push('/superadmin/users')
  }

  const { mutate: archiveMutate, isPending } = useArchiveUser({ id: selectedUser.id, archiveState: !selectedUser.isArchived });

  const handleArchiveUser = () => {
    archiveMutate(null as unknown as void, {
      onSuccess: () => {
        toast.success('Archived successfully.');
        setIsConfirmArchiveDialogOpen(false);
        refetch();
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      }
    });
  }

  const { mutate: resendInvitationMutate } = useResendAdminInvitation({id: selectedUser.id});

  const onResendInvitationMenuItemClick = (user: User) => {
    setSelectedUser(user);

    resendInvitationMutate(null as unknown as void, {
      onSuccess: () => {
        toast.success('Resend invitation successful.');
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-bold text-md">Recently Added Users</h1>
        <div onClick={onGoToUsersView} className="flex items-center gap-1 text-purple-900 underline font-semibold cursor-pointer">
          <p className="text-xs">View more</p>
          <IconArrowRight className="object-contain w-3 h-3" />
        </div>
      </div>

      <section className="bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-60 max-w-[340px]">
                  <div>Name</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                  <div>Role</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[138px]">
                  <div>Status</div>
                </th>
                <th className="pr-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-right max-md:px-5 underline cursor-pointer"></th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                if (busy) {
                  return (
                    <tr>
                      <td colSpan={8}>
                        <div className="relative py-16">
                          <div className="absolute inset-0 flex items-center justify-center rounded-xl z-10">
                            <HashLoader color="#AB58E7" size={40} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                if (!adminUsers?.length) {
                  return (
                    <tr>
                      <td colSpan={8}>
                        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                          <p className="text-lg font-medium">No users found</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Once users are added, they will appear in this table.
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                }

                // Default: render rows
                return adminUsers.map((user: User) => (
                  <tr key={user.id} onClick={() => onTableRowClick?.(user.id)}>
                    <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      <div className="flex flex-1 items-center">
                        {user?.profile?.avatarUrl ? (
                          <Image
                            width={40}
                            height={40}
                            alt="User Avatar"
                            src={user?.profile?.avatarUrl}
                            className="mr-2.5 w-10 h-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="mr-2.5 w-10 h-10 text-base text-violet-500 bg-purple-50 rounded-full flex items-center justify-center">
                            {getInitials(user.firstName, user.lastName)}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-base text-zinc-800">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-sm text-neutral-500">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                      {user.role.label}
                    </td>

                    <td className="px-6 py-6 leading-none text-center border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      <div className="flex items-center justity-start">
                        <Badge
                          text={capitalizeFirstLetter(user.status)}
                          showDot={true}
                          variant={user.status}
                        />
                      </div>
                    </td>

                    <td className="border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)]">
                      <div className="flex items-center justify-end pr-6">
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <IconDots className="cursor-pointer" />
                          </Menu.Target>
                          <Menu.Dropdown className="!-ml-12 !-mt-2">
                            <Menu.Item 
                              onClick={() => onResendInvitationMenuItemClick(user)} 
                              disabled={user.status !== 'pending'}
                              leftSection={<IconSend2 size={18} color="#AB58E7" />}>
                              Resend Invitation
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
                ));
              })()}
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
        busy={isPending}
        dialogTitle="Confirm Archive"
        saveButtonText="Archive User"
        onClose={() => setIsConfirmArchiveDialogOpen(false)} 
        onSave={() =>handleArchiveUser()}
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


"use client";
import React, { useState } from "react";
import Badge from "../../common/Badge";
import { Menu } from '@mantine/core';
import {
  IconDots,
  IconSend2,
  IconSquareArrowDownFilled,
} from '@tabler/icons-react';
import { Dialog } from "@/components/common/Dialog";
import { useArchiveUser, useResendAdminInvitation } from "@/hooks/school-admin";
import { toast } from "react-toastify";
import { capitalizeFirstLetter, getInitials } from "@/utils/helpers";
import { ErrorResponse } from "@/@types";
import Image from "next/image";

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
  studentId?: string;
  userType: string;
  teacherId?: string;
  profile: {
    avatarUrl?: string;
  }
}

interface UserTableProps {
  users: User[];
  refetch: () => void;
  onClearFilterClick?: () => void;
}

export const UserTable = ({users, refetch, onClearFilterClick}: UserTableProps) => {

  const [isConfirmArchiveDialogOpen, setIsConfirmArchiveDialogOpen] = useState(false);
  const [isConfirmCredentialSubmitDialogOpen, setIsConfirmCredentialSubmitDialogOpen]  = useState(false);
  const [selectedUser, setSelectedUser] = useState<User>({} as User);

  const onArchiveUserMenuItemClick = (user: User) => {
    setIsConfirmArchiveDialogOpen(true)
    setSelectedUser(user);
  } 

  const onResendInvitationMenuItemClick = (user: User) => {
    setSelectedUser(user);

    resendInvitationMutate(null as unknown as void, {
      onSuccess: () => {
        toast.success('Resend invitation successful.');
        setIsConfirmCredentialSubmitDialogOpen(false);
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      }
    });
  } 

  const { mutate: archiveMutate, isPending } = useArchiveUser({ id: selectedUser.id, archiveState: !selectedUser.isArchived });
  const { mutate: resendInvitationMutate } = useResendAdminInvitation({id: selectedUser.id, role: selectedUser?.role?.name});

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
 
  return (
    <>
      <section className="bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[500px]">
            <caption className="sr-only">
              Users and their roles, status, and permissions
            </caption>
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-60 max-w-[340px]">
                  <div>Name</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                  <div>Role</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                  <div>ID</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[138px]">
                  <div>Status</div>
                </th>
                <th onClick={onClearFilterClick} className="pr-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-right max-md:px-5 underline cursor-pointer"> Clear all filters</th>
              </tr>
            </thead>
            <tbody>
              {users?.length > 0 ? (users.map((user: User) => (
                <tr key={user.id}>
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
                        <span className="text-base text-zinc-800">{user.firstName} {user.lastName}</span>
                        <span className="text-sm text-neutral-500">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    {user.role.label}
                  </td>
                  <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    {user.userType === 'student' ? user.studentId : user.teacherId}
                  </td>
                  <td
                    className={`px-6 py-6 leading-none text-center border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5`}
                  >
                    <div className="flex items-center justity-start">
                      <Badge 
                        text={capitalizeFirstLetter(user.status)}
                        showDot={true} 
                        variant={user.status} />
                    </div>
                  </td>
                    <td
                      className="border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)]"
                    >
                      <div className="flex items-center justify-end pr-6">
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <IconDots className="cursor-pointer" />
                          </Menu.Target>
                          <Menu.Dropdown className="!-ml-8 !-mt-2">
                            <Menu.Item 
                              onClick={() => {setSelectedUser(user);
                                setIsConfirmCredentialSubmitDialogOpen(true)}
                              } 
                              disabled={user.status !== 'pending'}
                              leftSection={<IconSend2 size={18} color="#AB58E7" />}>
                              Send credentials
                            </Menu.Item>
                            <Menu.Item 
                              onClick={() => onArchiveUserMenuItemClick(user)} 
                              leftSection={<IconSquareArrowDownFilled size={18} color="#AB58E7" />}>
                              {user.isArchived ? 'Unarchive User' : 'Archive User'}
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


      {/* Confirm Archive Dialog */}
      <Dialog 
        isOpen={isConfirmArchiveDialogOpen}
        busy={isPending}
        dialogTitle={selectedUser.isArchived ? "Confirm Unarchive" : "Confirm Archive"}
        saveButtonText={selectedUser.isArchived ? "Unarchive User" : "Archive User"}
        onClose={() => setIsConfirmArchiveDialogOpen(false)} 
        onSave={() =>handleArchiveUser()}
      >
        <div className="my-3 flex flex-col gap-4">
          <p>
            {selectedUser.isArchived ? 
              'Are you sure you want to unarchive this user? Their account will be activated, and their data will be restored.'
              :
              'Are you sure you want to archive this user? Their account will be deactivated, but their data will be kept.'
            }
          </p>
        </div>
      </Dialog>

      {/* Confirm Credential Submission Dialog */}
      <Dialog 
        isOpen={isConfirmCredentialSubmitDialogOpen}
        busy={isPending}
        dialogTitle="Confirm Credential Submission"
        saveButtonText="Send Credentials"
        onClose={() => setIsConfirmCredentialSubmitDialogOpen(false)} 
        onSave={() => {onResendInvitationMenuItemClick(selectedUser)}}
      >
        <div className="my-3 flex flex-col gap-1 text-base">
          <p>The following login credentials will be sent via email to the user:</p>
          <span>&bull; ID: [{selectedUser.userType === 'student' ? selectedUser.studentId : selectedUser.teacherId}]</span>
          <p>Once sent, the user will be able to access their account using these details. This action cannot be undone.
            Do you want to proceed?
          </p>
        </div>
      </Dialog>
    </>
  );
}


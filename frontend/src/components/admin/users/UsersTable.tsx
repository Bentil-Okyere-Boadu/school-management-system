"use client";
import * as React from "react";
import Badge from "../Badge";
import { PermissionTags } from "../PermissionsTag";


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

interface UserTableProps {
  users: User[];
  onTableRowClick?: (id: string) => void;
}

export const UserTable = ({users, onTableRowClick}: UserTableProps) => {
 
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
            {user.initials}
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
    <section className="bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[1000px]">
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
              <th className="pr-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-right max-md:px-5 underline cursor-pointer"> Clear all filters</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
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
                    <img
                        src="https://cdn.builder.io/api/v1/image/assets/TEMP/b2f2eaa24477a78660ce4a3d9636251012a42858?placeholderIfAbsent=true&apiKey=61b68a6030a244f09df9bfa72093b1ab"
                        className="object-contain self-stretch my-auto w-5 aspect-square"
                        alt="Table cell icon"
                    />
                    </div>
                  </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}


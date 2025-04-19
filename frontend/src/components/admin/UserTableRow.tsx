"use client";
import React from "react";
import { User } from "./../../utils/types";
import { StatusBadge } from "./StatusBadge";
import { PermissionTags } from "./PermissionsTag";

interface UserTableRowProps {
  user: User;
}

interface UserTableRowProps {
  user: User;
  isSelected?: boolean;
  onClick?: () => void;
}

export const UserTableRow: React.FC<UserTableRowProps> = ({
  user,
  isSelected = false,
  onClick = () => {},
}) => {
  return (
    <article
      className={`flex items-center px-6 py-4 border-b border-solid border-b-gray-200 ${isSelected ? "bg-[#D9CDE2] bg-opacity-30" : ""} cursor-pointer hover:bg-gray-50`}
      onClick={onClick}
    >
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
      <div className="flex-1">{user.role}</div>
      <div className="flex flex-1 items-center">
        <StatusBadge status={user.status} />
      </div>
      <div className="flex flex-1 items-center">
        <PermissionTags permissions={user.permissions} />
      </div>
      <div className="flex flex-1 items-center">
        <button aria-label="More options">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ cursor: "pointer" }}
          >
            <path
              d="M6.66659 10.0002C6.66659 10.4422 6.49099 10.8661 6.17843 11.1787C5.86587 11.4912 5.44195 11.6668 4.99992 11.6668C4.55789 11.6668 4.13397 11.4912 3.82141 11.1787C3.50885 10.8661 3.33325 10.4422 3.33325 10.0002C3.33325 9.55814 3.50885 9.13421 3.82141 8.82165C4.13397 8.50909 4.55789 8.3335 4.99992 8.3335C5.44195 8.3335 5.86587 8.50909 6.17843 8.82165C6.49099 9.13421 6.66659 9.55814 6.66659 10.0002ZM11.6666 10.0002C11.6666 10.4422 11.491 10.8661 11.1784 11.1787C10.8659 11.4912 10.4419 11.6668 9.99992 11.6668C9.55789 11.6668 9.13397 11.4912 8.82141 11.1787C8.50885 10.8661 8.33325 10.4422 8.33325 10.0002C8.33325 9.55814 8.50885 9.13421 8.82141 8.82165C9.13397 8.50909 9.55789 8.3335 9.99992 8.3335C10.4419 8.3335 10.8659 8.50909 11.1784 8.82165C11.491 9.13421 11.6666 9.55814 11.6666 10.0002ZM14.9999 11.6668C15.4419 11.6668 15.8659 11.4912 16.1784 11.1787C16.491 10.8661 16.6666 10.4422 16.6666 10.0002C16.6666 9.55814 16.491 9.13421 16.1784 8.82165C15.8659 8.50909 15.4419 8.3335 14.9999 8.3335C14.5579 8.3335 14.134 8.50909 13.8214 8.82165C13.5088 9.13421 13.3333 9.55814 13.3333 10.0002C13.3333 10.4422 13.5088 10.8661 13.8214 11.1787C14.134 11.4912 14.5579 11.6668 14.9999 11.6668Z"
              fill="#5B6871"
            ></path>
          </svg>
        </button>
      </div>
    </article>
  );
};

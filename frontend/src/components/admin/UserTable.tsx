import React from "react";
import { User } from "./.././../utils/types";
import { UserTableRow } from "./UserTableRow";

interface UserTableProps {
  users: User[];
  selectedUserId?: string | null;
  onSelectUser?: (id: string) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  selectedUserId = null,
  onSelectUser = () => {},
}) => {
  return (
    <section className="overflow-hidden bg-white rounded-lg max-md:overflow-x-auto max-sm:overflow-x-auto">
      <header className="flex px-6 py-3 bg-gray-50 border-b border-solid border-b-gray-200">
        <div className="flex-1 text-xs text-gray-500">Name</div>
        <div className="flex-1 text-xs text-gray-500">Role</div>
        <div className="flex-1 text-xs text-gray-500">Status</div>
        <div className="flex-1 text-xs text-gray-500">Permissions</div>
        <div className="flex-1 text-xs text-gray-500" />
      </header>
      {users.map((user) => (
        <UserTableRow
          key={user.id}
          user={user}
          isSelected={user.id === selectedUserId}
          onClick={() => onSelectUser(user.id)}
        />
      ))}
    </section>
  );
};
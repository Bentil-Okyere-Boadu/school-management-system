"use client";
import React, { useState } from "react";
import { Pagination } from "@/components/admin/Pagination";
import { UserTable } from "@/components/admin/UserTable";
import { SearchBar } from "@/components/admin/SearchBar";

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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };


  return (
    <div>
      <div className="flex justify-between items-center flex-wrap gap-4 w-full mb-6 px-0.5">
        <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full" />
        <button className="px-5 py-2.5 font-bold text-white bg-purple-500 rounded-md cursor-pointer">
          Invite New User
        </button>
      </div>
      <UserTable
        users={filteredUsers}
        selectedUserId={selectedUserId}
        onSelectUser={(id) => setSelectedUserId(id)}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={10}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default UsersPage;
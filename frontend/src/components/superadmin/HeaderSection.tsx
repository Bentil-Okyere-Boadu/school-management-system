"use client";
import React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Menu } from '@mantine/core';
import {
  IconBell,
  IconLogout2,
} from '@tabler/icons-react';
import Cookies from "js-cookie";
import Image from "next/image";
import NoProfileImg from '@/images/no-profile-img.png'
import { User } from "@/@types";
import { useGetSchoolById } from "@/hooks/super-admin";

interface HeaderSectionProps {
  activeMenuItem: string;
  isOverviewPage?: boolean;
  onToggleSidebar?: () => void;
  user: User;
  onNotificationClick?: () => void;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({ activeMenuItem, isOverviewPage, onToggleSidebar, user, onNotificationClick }) => {
  const router = useRouter();
  const pathName = usePathname();
  const params = useParams();
  const schoolId = params.id;
  const { school } = useGetSchoolById(schoolId as string);

  const onHandleBreadCrumbPress = () => {
    console.log(pathName);
    router.push(`/superadmin/${activeMenuItem?.toLowerCase()}`);
  };

  const onHandleLogout = () => {
    Cookies.remove("authToken");
    router.push("/home");
  }

  return (
    <header className="flex flex-col mb-2 w-full relative">
      {/* Top row: greeting + user info */}
      <div className="flex justify-between items-center flex-wrap gap-4 w-full">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden block p-2 cursor-pointer"
            aria-label="Toggle Sidebar"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* Conditionally render Overview Left Header Section or Detail view Left Header Section */}
          { isOverviewPage ? 
            (
              <div className="flex flex-col">
                <h1 className="text-2xl text-neutral-800">Hello, {user?.firstName} {user?.lastName}</h1>
                <p className="text-base text-zinc-600">Welcome to your {activeMenuItem} Overview</p>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="text-xs text-zinc-600">
                  <span onClick={onHandleBreadCrumbPress} className="cursor-pointer">{activeMenuItem}</span><span>{" > "}</span><span className="text-[#AB58E7] underline">{school?.name}</span>
                </div>
                <h2 className="text-2xl text-neutral-800 mt-2">{school?.name}</h2>
              </div>
            ) 
          }
        </div>

        <div className="flex items-center flex-wrap gap-3">
          <IconBell className="cursor-pointer size-6 mr-1" onClick={onNotificationClick} />

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <div className="flex gap-3 cursor-pointer">
                <Image
                  src={user?.profile?.avatarUrl || NoProfileImg.src}
                  width={100}
                  height={100}
                  alt="User Avatar"
                  className="w-11 h-11 rounded-full object-cover"
                />
                <div className="flex flex-col">
                  <span className="text-base text-neutral-800">{user?.firstName} {user?.lastName}</span>
                  <span className="text-xs text-zinc-600">{user?.role.name}</span>
                </div>
              </div>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Profile</Menu.Label>
              <Menu.Item onClick={onHandleLogout} leftSection={<IconLogout2 size={14} />}>
                Log out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      </div>
    </header>
  );
};

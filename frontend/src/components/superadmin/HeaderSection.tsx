"use client";
import React, { useMemo } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Menu } from '@mantine/core';
import {
  IconBell,
  IconLogout2,
} from '@tabler/icons-react';
import Cookies from "js-cookie";
import Image from "next/image";
import NoProfileImg from '@/images/no-profile-img.png'
import { Roles, User } from "@/@types";
import { getCookieNameForPath } from "@/utils/auth";
import { useGetSchoolById } from "@/hooks/super-admin";
import { useGetAdmissionById, useGetMySchool, useGetSchoolUserById, useGetNotifications } from "@/hooks/school-admin";
import { useGetStudentById, useGetTeacherClassById } from "@/hooks/teacher";
import config from "../../../config";

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
  const classId = params.classId as string | undefined;

  const getSignedInRole = () => {
    if(pathName.startsWith('/admin')) {
      return Roles.SCHOOL_ADMIN;
    } else if(pathName.startsWith('/superadmin')) {
      return Roles.SUPER_ADMIN;
    }
  }

  const isStudentDetailPage = pathName.includes(`/admin/students/${params.id}`);
  const {schoolUser} = useGetSchoolUserById(params.id as string, {
    enabled: isStudentDetailPage,
    queryKey: ['schoolUser', params.id],
  })

  const isSchoolDetailPage = pathName.includes(`/superadmin/schools/${params.id}`);
  const { school } = useGetSchoolById(schoolId as string, {
    enabled: isSchoolDetailPage,
    queryKey: [schoolId]
  });

  const { school: mySchool } = useGetMySchool(getSignedInRole() === Roles.SCHOOL_ADMIN? true : false );
  
  const isAdmissionDetailPage = pathName.includes(`/admin/admissions/${params.id}`);
  const { admissionData } = useGetAdmissionById(params.id as string, {
    enabled: isAdmissionDetailPage,
    queryKey: ['admission', params.id]
  });

  const isClassDetailPage = !!classId && (
    pathName.includes(`/teacher/classes/${classId}`) || pathName.includes(`/teacher/grading/${classId}`)
  );
  const { classData } = useGetTeacherClassById(classId ?? '', {
    enabled: isClassDetailPage,
    queryKey: ['teacherClass', classId]
  });

  const isTeacherStudentDetailPage = pathName.includes(`/teacher/students/${params.id}`);
  const {studentData} = useGetStudentById(params.id as string, {
    enabled: isTeacherStudentDetailPage,
    queryKey: ['student', params.id],
  })

  const signedInRole = getSignedInRole();

  // Get notifications for unread count badge
  const schoolIdForNotifications = signedInRole === Roles.SCHOOL_ADMIN ? user?.school?.id : null;
  const { notifications } = useGetNotifications(schoolIdForNotifications);
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const displayTitle: string = useMemo(() => {
    if (isOverviewPage) {
      if (signedInRole === Roles.SCHOOL_ADMIN) {
        return mySchool?.name;
      }
      return `Hello, ${user?.firstName} ${user?.lastName}`;
    }

    // Detail view
    if (admissionData) {
      return `${admissionData.studentFirstName} ${admissionData.studentLastName}`;
    }

    if (classData?.name) {
      return classData.name;
    }

    if(studentData) {
      return `${studentData?.firstName ?? ''} ${studentData?.lastName ?? ''}`;
    }

    if (signedInRole === Roles.SUPER_ADMIN) {
      return school?.name;
    }

    if (signedInRole === Roles.SCHOOL_ADMIN) {
      return `${schoolUser?.firstName ?? ''} ${schoolUser?.lastName ?? ''}`;
    }

    // Default fallback (e.g., teacher, student)
    return `${user?.firstName ?? ''} ${user?.lastName ?? ''}`;
  }, [isOverviewPage, signedInRole, user, school, schoolUser, mySchool, admissionData, classData, studentData]);

  const onHandleBreadCrumbPress = (event) => {
    const oEventTarget = (event.currentTarget ?? event.target) as HTMLElement;
    const spanText = oEventTarget.textContent?.trim() ?? '';
    if (spanText === activeMenuItem && getSignedInRole() === Roles.SUPER_ADMIN) {
      router.push(`/superadmin/schools`)
    } else {
      window.history.back();
    }
  };

  const onHandleLogout = async () => {
    // Get refresh token before clearing cookies
    const cookieName = getCookieNameForPath(pathName);
    let refreshToken: string | undefined;
    
    if (cookieName) {
      refreshToken = Cookies.get(`${cookieName}Refresh`);
    }

    // Call backend logout to invalidate refresh token
    if (refreshToken) {
      try {
        await fetch(`${config().apiURL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    // Remove all cookies for this role
    if (cookieName) {
      Cookies.remove(cookieName);
      Cookies.remove(`${cookieName}Refresh`);
    } else {
      // Fallback: remove all role cookies if we can't determine the role
      Cookies.remove("superAdminToken");
      Cookies.remove("superAdminTokenRefresh");
      Cookies.remove("adminToken");
      Cookies.remove("adminTokenRefresh");
      Cookies.remove("teacherToken");
      Cookies.remove("teacherTokenRefresh");
      Cookies.remove("studentToken");
      Cookies.remove("studentTokenRefresh");
    }
    
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
                { getSignedInRole() === Roles.SCHOOL_ADMIN? (
                  <h1 className="text-2xl text-neutral-800">{mySchool?.name}</h1>
                ) : (
                  <h1 className="text-2xl text-neutral-800">Hello, {user?.firstName} {user?.lastName}</h1>
                )
                }
                
                <p className="text-base text-zinc-600">Welcome to {activeMenuItem} Overview</p>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="text-xs text-zinc-600">
                  <span onClick={onHandleBreadCrumbPress} className="cursor-pointer">{activeMenuItem}</span><span>{" > "}</span><span className="text-[#AB58E7] underline">{displayTitle}</span>
                </div>
                <h2 className="text-2xl text-neutral-800 mt-2">{displayTitle}</h2>
              </div>
            ) 
          }
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {signedInRole === Roles.SCHOOL_ADMIN && (
            <div className="relative mr-1">
              <IconBell className="cursor-pointer size-6" onClick={onNotificationClick} />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          )}

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
                  <span className="text-xs text-zinc-600">{user?.role.label}</span>
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

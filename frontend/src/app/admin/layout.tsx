"use client";
import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/common/Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { DashboardIcon, ClassroomIcon, UsersIcon, AdmissionsIcon, AttendanceIcon, StudentsIcon, SubjectIcon } from "@/utils/icons";
import { HeaderSection } from "@/components/superadmin/HeaderSection";
import { useGetMe } from "@/hooks/school-admin";
import NotificationCard from "@/components/common/NotificationCard";
import { Roles } from "@/@types";

export const Layout = ({ children }: {children: React.ReactNode}) => {
  const router = useRouter();
  const pathname = usePathname();

  const [activeMenuItem, setActiveMenuItem] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOverviewPage, setIsOverviewPage] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  const {me} = useGetMe();

  const sidebarItems = [
    {
      icon: DashboardIcon,
      label: "Dashboard",
    },
    {
      icon: UsersIcon,      
      label: "All Users",
    },
    {
      icon: StudentsIcon,      
      label: "Students",
    },
    {
      icon: AdmissionsIcon,      
      label: "Admissions",
    },
    {
      icon: AttendanceIcon,      
      label: "Attendance",
    },
    {
      icon: ClassroomIcon,      
      label: "Classes",
    },
    {
      icon: SubjectIcon,
      label: "Subjects"
    }
  ];

  useEffect(() => {
    // Overview Pages
    if (pathname === "/admin/dashboard") {
      setActiveMenuItem("Dashboard");
      setIsOverviewPage(true);
    } else if (pathname === "/admin/users") {
      setActiveMenuItem("All Users");
      setIsOverviewPage(true);
    } else if (pathname === "/admin/students") {
      setActiveMenuItem("Students");
      setIsOverviewPage(true);
    } else if (pathname === "/admin/admissions") {
      setActiveMenuItem("Admissions");
      setIsOverviewPage(true);
    } else if (pathname === "/admin/attendance") {
      setActiveMenuItem("Attendance");
      setIsOverviewPage(true);
    } else if (pathname === "/admin/classes") {
      setActiveMenuItem("Classes");
      setIsOverviewPage(true);
    } else if (pathname === "/admin/settings") {
      setActiveMenuItem("Settings");
      setIsOverviewPage(true);
    } else if (pathname === "/admin/subjects") {
      setActiveMenuItem("Subjects");
      setIsOverviewPage(true);
    } else if (pathname === "/admin/notifications") {
      setActiveMenuItem("Notifications");
      setIsOverviewPage(true);
    }
    
    // Detail Pages
    else if (pathname.startsWith("/admin/schools/")) {
      setActiveMenuItem("Schools");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/admin/users/")) {
      setActiveMenuItem("Users");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/admin/settings/")) {
      setActiveMenuItem("Settings");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/admin/students/")) {
      setActiveMenuItem("Students");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/admin/admissions/")) {
      setActiveMenuItem("Admissions");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/admin/attendance/")) {
      setActiveMenuItem("Attendance");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/admin/classes/")) {
      setActiveMenuItem("Classes");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/admin/notifications/")) {
      setActiveMenuItem("Notifications");
      setIsOverviewPage(true);
    }
    
    // Default
    else {
      setIsOverviewPage(false);
    }
  }, [pathname]);

  const handleSidebarClick = (item: string) => {
    switch (item) {
      case "Dashboard":
        router.push("/admin/dashboard");
        break;
      case "All Users":
        router.push("/admin/users");
        break;
      case "Students":
        router.push("/admin/students");
        break;
      case "Admissions":
        router.push("/admin/admissions");
        break;
      case "Attendance":
        router.push("/admin/attendance");
        break;
      case "Classes":
        router.push("/admin/classes");
        break;
      case "Settings":
        router.push("/admin/settings");
        break;
      case "Subjects":
        router.push("/admin/subjects");
        break;
    }
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex flex-row mx-auto w-full min-h-screen max-w-none bg-zinc-100 max-md:flex-col max-md:max-w-[991px] max-sm:max-w-screen-sm">
      {/* Sidebar for large screens */}
      <div className="hidden h-screen md:flex sticky top-0 overflow-y-auto bg-[#D9CDE2]">
        <Sidebar activeItem={activeMenuItem} sidebarItems={sidebarItems} onItemChange={handleSidebarClick}  isSchoolAdminDashboard={true}/>
      </div>

      {/* Sidebar Overlay for small screens */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex min-h-[100%]">
          <div className="bg-[#D9CDE2] w-64 h-full shadow-lg overflow-y-auto">
            <Sidebar activeItem={activeMenuItem} sidebarItems={sidebarItems} onItemChange={handleSidebarClick} isSchoolAdminDashboard={true}/>
          </div>
          {/* Backdrop */}
          <div className="flex-1 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
        </div>
      )}

      <section className="box-border flex-1 p-5 max-md:p-2.5 max-sm:p-1.5 overflow-hidden relative">
        <HeaderSection user={me} isOverviewPage={isOverviewPage} activeMenuItem={activeMenuItem} 
        onToggleSidebar={() => setIsSidebarOpen(true)}
        onNotificationClick={() => {setShowNotification(!showNotification)}} />
        <main className="flex-1 pt-8 overflow-auto">
          {children}
          {(showNotification && me.role.name === Roles.SCHOOL_ADMIN) && <NotificationCard user={me} onClose={() => setShowNotification(false)} />}
        </main>
      </section>
    </div>
  );
};

export default Layout;

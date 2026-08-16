"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/common/Sidebar";
import { HeaderSection } from "@/components/superadmin/HeaderSection";
import { usePathname, useRouter } from "next/navigation";
import { ClassroomIcon, StudentsIcon, ProfileIcon, SubjectIcon, ClipboardIcon, PlannerIcon, PerformanceIcon } from "@/utils/icons";

import { useTeacherGetMe } from "@/hooks/teacher";
import NotificationCard from "@/components/common/NotificationCard";

export const Layout = ({ children }: {children: React.ReactNode}) => {
  const router = useRouter();
  const pathname = usePathname();

  const [activeMenuItem, setActiveMenuItem] = useState("students");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOverviewPage, setIsOverviewPage] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  const {me} = useTeacherGetMe();

  const sidebarItems = [
    {
      icon: StudentsIcon,
      label: "Students",
    },
    {
      icon: ClassroomIcon,      
      label: "Classes",
    },
    {
      icon: SubjectIcon,      
      label: "Grading",
    },
    {
      icon: ClipboardIcon,      
      label: "Curriculum",
    },
    {
      icon: PlannerIcon,      
      label: "Planner",
    },
    {
      icon: PerformanceIcon,
      label: "Performance Analytics",
    },
    {
      icon: ProfileIcon,      
      label: "Profile",
    },
  ];


  useEffect(() => {
    // Overview Pages
    if (pathname === "/teacher/students") {
      setActiveMenuItem("Students");
      setIsOverviewPage(true);
    } else if (pathname === "/teacher/classes") {
      setActiveMenuItem("Classes");
      setIsOverviewPage(true);
    } else if (pathname === "/teacher/profile") {
      setActiveMenuItem("Profile");
      setIsOverviewPage(true);
    } else if (pathname === "/teacher/grading") {
      setActiveMenuItem("Grading");
      setIsOverviewPage(true);
    } else if (pathname === "/teacher/subjects" || pathname.startsWith("/teacher/assignments/")) {
      setActiveMenuItem("Curriculum");
      setIsOverviewPage(true);
    } else if (pathname === "/teacher/planner") {
      setActiveMenuItem("Planner");
      setIsOverviewPage(true);
    } else if (pathname === "/teacher/notifications") {
      setActiveMenuItem("Notifications");
      setIsOverviewPage(true);
    } else if (
      pathname === "/teacher/performance-analytics" ||
      pathname.startsWith("/teacher/performance-analytics/")
    ) {
      setActiveMenuItem("Performance Analytics");
      setIsOverviewPage(true);
    }

    // Detail Pages
    else if (pathname.startsWith("/teacher/students/")) {
      setActiveMenuItem("Students");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/teacher/classes/")) {
      setActiveMenuItem("Classes");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/teacher/grading/")) {
      setActiveMenuItem("Grading");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/teacher/subjects")) {
      setActiveMenuItem("Curriculum");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/teacher/planner")) {
      setActiveMenuItem("Planner");
      setIsOverviewPage(false);
    }
    
    // Default
    else {
      setIsOverviewPage(false);
    }
  }, [pathname]);

  const handleSidebarClick = (item: string) => {
    switch (item) {
      case "Students":
        router.push("/teacher/students");
        break;
      case "Classes":
        router.push("/teacher/classes");
        break;
      case "Profile":
        router.push("/teacher/profile");
        break;
      case "Grading":
        router.push("/teacher/grading");
        break;
      case "Curriculum":
        router.push("/teacher/subjects");
        break;
      case "Planner":
        router.push("/teacher/planner");
        break;
      case "Performance Analytics":
        router.push("/teacher/performance-analytics");
        break;
    }
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex flex-row mx-auto w-full min-h-screen max-w-none bg-zinc-100 max-md:flex-col max-md:max-w-[991px] max-sm:max-w-screen-sm">
      {/* Sidebar for large screens */}
      <div className="hidden h-screen md:flex sticky top-0 overflow-y-auto bg-[#D9CDE2]">
        <Sidebar activeItem={activeMenuItem} sidebarItems={sidebarItems} onItemChange={handleSidebarClick} />
      </div>

      {/* Sidebar Overlay for small screens */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex min-h-[100%]">
          <div className="bg-[#D9CDE2] w-64 h-full shadow-lg overflow-y-auto">
            <Sidebar activeItem={activeMenuItem} sidebarItems={sidebarItems} onItemChange={handleSidebarClick} />
          </div>
          {/* Backdrop */}
          <div className="flex-1 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
        </div>
      )}

      <section className="box-border flex-1 p-5 max-md:p-2.5 max-sm:p-1.5 overflow-hidden relative">
        <HeaderSection
          user={me}
          isOverviewPage={isOverviewPage}
          activeMenuItem={activeMenuItem}
          onToggleSidebar={() => setIsSidebarOpen(true)}
          onNotificationClick={() => {
            setShowNotification(!showNotification);
          }}
        />
        <main className="flex-1 pt-8 overflow-auto">
          {children}
          {showNotification && me && (
            <NotificationCard
              user={me}
              source="teacher"
              inboxPath="/teacher/notifications"
              onClose={() => setShowNotification(false)}
            />
          )}
        </main>
      </section>
    </div>
  );
};

export default Layout;

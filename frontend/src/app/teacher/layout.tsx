"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/common/Sidebar";
import { HeaderSection } from "@/components/superadmin/HeaderSection";
import { usePathname, useRouter } from "next/navigation";
import { ClassesIcon, StudentsIcon, ProfileIcon } from "@/utils/icons";

import { useTeacherGetMe } from "@/hooks/teacher";

export const Layout = ({ children }: {children: React.ReactNode}) => {
  const router = useRouter();
  const pathname = usePathname();

  const [activeMenuItem, setActiveMenuItem] = useState("students");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOverviewPage, setIsOverviewPage] = useState(true);

  const {me} = useTeacherGetMe();

  const sidebarItems = [
    {
      icon: StudentsIcon,
      label: "Students",
    },
    {
      icon: ClassesIcon,      
      label: "Classes",
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
    } 

    // Detail Pages
    else if (pathname.startsWith("/teacher/students/")) {
      setActiveMenuItem("Students");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/teacher/classes/")) {
      setActiveMenuItem("Classes");
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

      <section className="box-border flex-1 p-5 max-md:p-2.5 max-sm:p-1.5 overflow-hidden">
        <HeaderSection user={me} isOverviewPage={isOverviewPage} activeMenuItem={activeMenuItem} onToggleSidebar={() => setIsSidebarOpen(true)} />
        <main className="flex-1 pt-8 overflow-auto">
          {children}
        </main>
      </section>
    </div>
  );
};

export default Layout;

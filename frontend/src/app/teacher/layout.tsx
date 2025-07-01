"use client";
import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/common/Sidebar";
import { HeaderSection } from "@/components/superadmin/HeaderSection";
import { usePathname, useRouter } from "next/navigation";
import { DashboardIcon, UsersIcon, SchoolsIcon } from "@/utils/icons";
import { useGetMe } from "@/hooks/teacher";

export const Layout = ({ children }: {children: React.ReactNode}) => {
  const router = useRouter();
  const pathname = usePathname();

  const [activeMenuItem, setActiveMenuItem] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOverviewPage, setIsOverviewPage] = useState(true);

  const {me} = useGetMe();

  const sidebarItems = [
    {
      icon: DashboardIcon,
      label: "Students",
    },
    {
      icon: UsersIcon,      
      label: "Attendance",
    },
    {
      icon: SchoolsIcon,      
      label: "Grading",
    },
  ];


  useEffect(() => {
    // Overview Pages
    if (pathname === "/teacher/students") {
      setActiveMenuItem("Students");
      setIsOverviewPage(true);
    } else if (pathname === "/teacher/attendance") {
      setActiveMenuItem("Attendance");
      setIsOverviewPage(true);
    } else if (pathname === "/teacher/grading") {
      setActiveMenuItem("Grading");
      setIsOverviewPage(true);
    } 
    
    // Detail Pages
    else if (pathname.startsWith("/teacher/schools/")) {
      setActiveMenuItem("Schools");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/teacher/grading/")) {
      setActiveMenuItem("Grading");
      setIsOverviewPage(false);
    } else if (pathname.startsWith("/teacher/attendance/")) {
      setActiveMenuItem("Attendance");
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
        router.push("/teacher/dashboard");
        break;
      case "Schools":
        router.push("/teacher/schools");
        break;
      case "Grading":
        router.push("/teacher/grading");
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
